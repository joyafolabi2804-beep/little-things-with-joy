"""Parse the current HTML into the limited DOM fixture used by the control smoke test."""
from html.parser import HTMLParser
from pathlib import Path
import json
class Tree(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = {'tag': 'document', 'attrs': {}, 'children': []}
        self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(node)
        if tag not in ['meta', 'link', 'img', 'input', 'br', 'hr']:
            self.stack.append(node)
    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index]['tag'] == tag:
                self.stack = self.stack[:index]
                break
    def handle_data(self, data):
        self.stack[-1]['children'].append(data)
parser = Tree()
parser.feed((Path(__file__).resolve().parents[1] / 'dist/index.html').read_text())
print(json.dumps(parser.root))
