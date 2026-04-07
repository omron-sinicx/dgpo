#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# save_path=${1:-./save}
save_path=${RETRIEVER_DATA_PATH:-./save}

echo -e "${BLUE}📂 Save path: $save_path${NC}"
echo ""

echo "⬇️  Downloading data... 🚀"
python download.py --save_path "$save_path"
echo -e "${GREEN}✅ Download complete! 🎯${NC}"
echo ""

echo "🔗 Merging index files... 🧩"
cat "$save_path"/part_* > "$save_path/e5_Flat.index"
echo -e "${GREEN}✅ Index merged! 🪄${NC}"
echo ""

echo "📦 Decompressing wiki data... 💨"
gzip -d "$save_path/wiki-18.jsonl.gz"
echo -e "${GREEN}✅ Decompression complete! 🎈${NC}"
echo ""

echo -e "${YELLOW}🎉✨ All done! Data is ready at $save_path 🎊✨${NC}"
