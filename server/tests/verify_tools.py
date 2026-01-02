import asyncio
import os
import sys

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.tools import word_tool, excel_tool, ppt_tool

async def verify_tools():
    print("Starting Tool Verification...")
    
    # 1. Test Word Tool
    print("\n[1] Testing Word Generation Tool...")
    result_word = await word_tool.run(
        prompt="Create a meeting agenda for Project Alpha kickoff",
        title="Project Alpha Agenda"
    )
    if result_word.success:
        print(f"✅ Word Tool Success: {result_word.data['file_path']}")
    else:
        print(f"❌ Word Tool Failed: {result_word.error}")

    # 2. Test Excel Tool
    print("\n[2] Testing Excel Generation Tool...")
    result_excel = await excel_tool.run(
        prompt="Create a budget for Q1 2024 with 5 items",
        title="Q1 Budget"
    )
    if result_excel.success:
        print(f"✅ Excel Tool Success: {result_excel.data['file_path']}")
    else:
        print(f"❌ Excel Tool Failed: {result_excel.error}")

    # 3. Test PPT Tool
    print("\n[3] Testing PPT Generation Tool...")
    result_ppt = await ppt_tool.run(
        prompt="Create a 5 slide presentation about AI Agents",
        title="AI Agents Overview"
    )
    if result_ppt.success:
        print(f"✅ PPT Tool Success: {result_ppt.data['file_path']}")
    else:
        print(f"❌ PPT Tool Failed: {result_ppt.error}")

if __name__ == "__main__":
    asyncio.run(verify_tools())
