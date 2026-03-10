"""
scraper_logic.py — Core AI scraping engine.

Supports X (Twitter) and Reddit with:
  • Headless Chromium via browser-use + Playwright
  • Reddit JSON fast-path (no browser needed for most posts)
  • Concurrent multi-URL scraping via asyncio.gather
"""

import os
import re
import json
import asyncio
import logging
import requests
from typing import Optional

from browser_use import Agent
from browser_use.browser.browser import Browser, BrowserConfig
from langchain_openai import ChatOpenAI

from src.config import load_settings

logger = logging.getLogger(__name__)

# ── Globals (initialised lazily) ─────────────────────────────────
_llm = None
_browser = None


def _get_llm():
    global _llm
    if _llm is None:
        cfg = load_settings()
        _llm = ChatOpenAI(
            model=cfg["commonstack_model"],
            api_key=cfg["commonstack_api_key"],
            base_url=cfg["commonstack_base_url"],
        )
    return _llm


def _get_browser():
    global _browser
    if _browser is None:
        cfg = load_settings()
        _browser = Browser(config=BrowserConfig(headless=cfg["headless"]))
    return _browser


# ────────────────────────────────────────────────────
#  Reddit JSON fast-path (no browser needed)
# ────────────────────────────────────────────────────
def _reddit_fast_path(url: str) -> Optional[dict]:
    """Try to scrape Reddit metrics from the public .json API.
    Returns a dict on success, None on failure (fallback to browser).
    """
    try:
        # Normalise to www so the .json trick works
        json_url = url.rstrip("/") + ".json"
        json_url = json_url.replace("old.reddit.com", "www.reddit.com")
        resp = requests.get(
            json_url,
            headers={"User-Agent": "scraper-gui/1.0"},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        post = data[0]["data"]["children"][0]["data"]
        return {
            "upvotes": int(post.get("ups", 0)),
            "comments": int(post.get("num_comments", 0)),
        }
    except Exception as e:
        logger.debug(f"Reddit fast-path failed ({e}), falling back to browser")
        return None


# ────────────────────────────────────────────────────
#  Browser-based scrapers (AI agent)
# ────────────────────────────────────────────────────
async def _run_agent(task_prompt: str) -> str:
    agent = Agent(
        task=task_prompt,
        llm=_get_llm(),
        browser=_get_browser(),
        generate_gif=False,
        use_vision=False,
        max_actions_per_step=4,
    )
    
    # Monkeypatch to fix PyInstaller telemetry bug in browser-use
    class DummyTelemetry:
        def capture(self, *args, **kwargs):
            pass
    agent.telemetry = DummyTelemetry()
    
    result = await agent.run()
    return result.final_result()


async def scrape_x(url: str) -> dict:
    prompt = f"""
    Go to {url} and extract the engagement numbers for this post.
    IMPORTANT: X (Twitter) does NOT show the words "Like" or "Repost".
    Instead, look below the main post text for a row of small numbers
    next to icon buttons:
      • speech bubble icon = replies
      • recycling arrows icon = reposts
      • heart icon = likes
      • bar-chart icon = views
    Extract those specific numbers and return ONLY a valid JSON object
    with keys: "likes", "reposts", "replies", "views".
    """
    raw = await _run_agent(prompt)
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return {"raw": raw}


async def scrape_reddit(url: str) -> dict:
    # Try fast-path first
    fast = _reddit_fast_path(url)
    if fast:
        logger.info(f"✅ Reddit fast-path success: {fast}")
        return fast

    # Fall back to browser
    old_url = url.replace("www.reddit.com", "old.reddit.com") \
                  .replace("://reddit.com", "://old.reddit.com")
    prompt = f"""
    Go to {old_url} and extract the engagement numbers for this Reddit post.
    IMPORTANT: Reddit does NOT use the word "likes". It uses UPVOTES.
    Look for:
      • The upvote count: the number displayed next to the UP arrow (▲)
        on the left side of the post. It may say something like "5 points".
      • The comment count: the number shown next to the word "comments"
        at the bottom of the post.
    Extract those numbers and return ONLY a valid JSON object
    with keys: "upvotes", "comments".
    """
    raw = await _run_agent(prompt)
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return {"raw": raw}


# ────────────────────────────────────────────────────
#  URL router
# ────────────────────────────────────────────────────
async def scrape_url(url: str) -> dict:
    """Detect platform from the URL and call the right scraper."""
    if "x.com" in url or "twitter.com" in url:
        return await scrape_x(url)
    elif "reddit.com" in url:
        return await scrape_reddit(url)
    else:
        raise ValueError(f"Unsupported platform: {url}")


# ────────────────────────────────────────────────────
#  Batch concurrent scraper
# ────────────────────────────────────────────────────
async def scrape_batch(urls: list[str], max_concurrent: int = 5) -> list[dict]:
    """Scrape a list of URLs concurrently, returning results in order."""
    sem = asyncio.Semaphore(max_concurrent)

    async def _limited(url: str) -> dict:
        async with sem:
            try:
                data = await scrape_url(url)
                return {"url": url, "status": "ok", "data": data}
            except Exception as e:
                return {"url": url, "status": "error", "error": str(e)}

    tasks = [_limited(u) for u in urls]
    return await asyncio.gather(*tasks)
