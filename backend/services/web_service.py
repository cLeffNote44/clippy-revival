from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from typing import Dict, List, Optional, Any
import asyncio
import base64

class WebService:
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.contexts: Dict[str, BrowserContext] = {}
        self.pages: Dict[str, Page] = {}
        self.headless = True
        self.browser_installed = False
    
    async def initialize(self):
        """Initialize Playwright"""
        if not self.playwright:
            self.playwright = await async_playwright().start()
            self.browser_installed = True
    
    async def start_session(
        self,
        session_id: str = "default",
        headless: bool = True
    ) -> Dict:
        """Start a new browser session"""
        try:
            await self.initialize()
            
            if not self.browser:
                self.browser = await self.playwright.chromium.launch(headless=headless)
            
            # Create new context for this session
            context = await self.browser.new_context()
            page = await context.new_page()
            
            self.contexts[session_id] = context
            self.pages[session_id] = page
            
            return {
                "success": True,
                "session_id": session_id,
                "headless": headless
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def stop_session(self, session_id: str = "default") -> Dict:
        """Stop a browser session"""
        try:
            if session_id in self.contexts:
                await self.contexts[session_id].close()
                del self.contexts[session_id]
                del self.pages[session_id]
            
            return {
                "success": True,
                "session_id": session_id
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def navigate(
        self,
        url: str,
        session_id: str = "default",
        wait_until: str = "load"
    ) -> Dict:
        """Navigate to a URL"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found. Start a session first."}
            
            page = self.pages[session_id]
            await page.goto(url, wait_until=wait_until)
            
            return {
                "success": True,
                "url": page.url,
                "title": await page.title()
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def click(
        self,
        selector: str,
        session_id: str = "default"
    ) -> Dict:
        """Click an element"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            await page.click(selector)
            
            return {"success": True, "selector": selector}
            
        except Exception as e:
            return {"error": str(e)}
    
    async def fill(
        self,
        selector: str,
        text: str,
        session_id: str = "default"
    ) -> Dict:
        """Fill a form field"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            await page.fill(selector, text)
            
            return {"success": True, "selector": selector}
            
        except Exception as e:
            return {"error": str(e)}
    
    async def press(
        self,
        key: str,
        session_id: str = "default"
    ) -> Dict:
        """Press a keyboard key"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            await page.keyboard.press(key)
            
            return {"success": True, "key": key}
            
        except Exception as e:
            return {"error": str(e)}
    
    async def wait_for(
        self,
        selector: str,
        session_id: str = "default",
        timeout: int = 30000
    ) -> Dict:
        """Wait for an element to appear"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            await page.wait_for_selector(selector, timeout=timeout)
            
            return {"success": True, "selector": selector}
            
        except Exception as e:
            return {"error": str(e)}
    
    async def extract_text(
        self,
        selector: str,
        session_id: str = "default"
    ) -> Dict:
        """Extract text from an element"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            element = await page.query_selector(selector)
            
            if not element:
                return {"error": "Element not found"}
            
            text = await element.text_content()
            
            return {
                "success": True,
                "selector": selector,
                "text": text
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def extract_multiple(
        self,
        selector: str,
        session_id: str = "default"
    ) -> Dict:
        """Extract text from multiple elements"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            elements = await page.query_selector_all(selector)
            
            texts = []
            for element in elements:
                text = await element.text_content()
                texts.append(text)
            
            return {
                "success": True,
                "selector": selector,
                "texts": texts,
                "count": len(texts)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def screenshot(
        self,
        session_id: str = "default",
        full_page: bool = False
    ) -> Dict:
        """Take a screenshot"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            screenshot_bytes = await page.screenshot(full_page=full_page)
            
            # Convert to base64 for transmission
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            return {
                "success": True,
                "screenshot": screenshot_b64,
                "format": "png"
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def execute_script(
        self,
        script: str,
        session_id: str = "default"
    ) -> Dict:
        """Execute JavaScript on the page"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            result = await page.evaluate(script)
            
            return {
                "success": True,
                "result": result
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def get_page_info(self, session_id: str = "default") -> Dict:
        """Get current page information"""
        try:
            if session_id not in self.pages:
                return {"error": "Session not found"}
            
            page = self.pages[session_id]
            
            return {
                "url": page.url,
                "title": await page.title(),
                "viewport": page.viewport_size
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def execute_steps(
        self,
        steps: List[Dict],
        session_id: str = "default"
    ) -> Dict:
        """Execute a sequence of automation steps"""
        try:
            results = []
            
            for step in steps:
                action = step.get("action")
                
                if action == "navigate":
                    result = await self.navigate(step["url"], session_id)
                elif action == "click":
                    result = await self.click(step["selector"], session_id)
                elif action == "fill":
                    result = await self.fill(step["selector"], step["text"], session_id)
                elif action == "press":
                    result = await self.press(step["key"], session_id)
                elif action == "wait":
                    result = await self.wait_for(step["selector"], session_id)
                elif action == "extract":
                    result = await self.extract_text(step["selector"], session_id)
                elif action == "screenshot":
                    result = await self.screenshot(session_id)
                elif action == "sleep":
                    await asyncio.sleep(step.get("duration", 1))
                    result = {"success": True}
                else:
                    result = {"error": f"Unknown action: {action}"}
                
                results.append({
                    "step": step,
                    "result": result
                })
                
                # Stop if step failed
                if "error" in result:
                    break
            
            return {
                "success": True,
                "steps_executed": len(results),
                "results": results
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def cleanup(self):
        """Cleanup all resources"""
        try:
            # Close all contexts
            for context in self.contexts.values():
                await context.close()
            
            self.contexts.clear()
            self.pages.clear()
            
            # Close browser
            if self.browser:
                await self.browser.close()
                self.browser = None
            
            # Stop playwright
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
            
        except Exception as e:
            print(f"Error during cleanup: {e}")