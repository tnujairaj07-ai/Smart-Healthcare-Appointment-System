import re

def check_jsx_balance(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Strip multi-line comments: {/* ... */}
    content_clean = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
    # Strip HTML comments: <!-- ... -->
    content_clean = re.sub(r'<!--.*?-->', '', content_clean, flags=re.DOTALL)
    # Strip single line comments: // ... (make sure we do not strip http:// URLs)
    content_clean = re.sub(r'(?<!:)\/\/.*', '', content_clean)

    stack = []
    
    # Match tag pattern
    # Group 1: tag name (with leading '/' if closing)
    # Group 2: '/' if self-closing
    tag_pattern = re.compile(r'<(/?[a-zA-Z0-9_-]+)(?:\s+[^>]*?)?(/?)(>)', re.DOTALL)
    
    for match in tag_pattern.finditer(content_clean):
        tag_name = match.group(1)
        is_close = tag_name.startswith('/')
        is_self_closing = match.group(2) == '/'
        
        # Calculate line number in clean content
        line_num = content_clean[:match.start()].count('\n') + 1
        
        if is_close:
            tag_name = tag_name[1:]
            
        # Ignore tags that are self-closing or component place-holders
        if is_self_closing or tag_name.lower() in ['input', 'img', 'br', 'hr', 'circle', 'line', 'path', 'defs', 'lineargradient', 'stop', 'meta', 'link', 'rect', 'toast', 'navbar', 'sidebar', 'style', 'counter']:
            continue
            
        if is_close:
            if not stack:
                print(f"Line {line_num}: Extra closing tag </{tag_name}> found with empty stack")
                continue
            last_tag, last_line = stack.pop()
            if last_tag != tag_name:
                print(f"Line {line_num}: Mismatched closing tag </{tag_name}>, expected </{last_tag}> (opened at line {last_line})")
        else:
            stack.append((tag_name, line_num))
            
    if stack:
        print("\nUnclosed tags remaining in stack at end of file:")
        for tag, line in stack:
            print(f"  <{tag}> opened at line {line}")
    else:
        print("\nAll tags are balanced!")

if __name__ == '__main__':
    check_jsx_balance('c:/Users/LENOVO/smart_healthcare/frontend/src/pages/AdminDashboard.jsx')
