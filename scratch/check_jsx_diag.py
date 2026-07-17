import re

def check_jsx_balance(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean comments while preserving character lengths and offsets
    def strip_jsx(m):
        s = m.group(0)
        return '\n' * s.count('\n') + ' ' * (len(s) - s.count('\n'))
        
    content_clean = re.sub(r'\{/\*.*?\*/\}', strip_jsx, content, flags=re.DOTALL)
    content_clean = re.sub(r'<!--.*?-->', strip_jsx, content_clean, flags=re.DOTALL)
    
    def strip_line_comment(m):
        return ' ' * len(m.group(0))
    content_clean = re.sub(r'(?<!:)\/\/.*', strip_line_comment, content_clean)

    # Print clean content lines 2370 to 2385 for inspection
    clean_lines = content_clean.split('\n')
    for idx in range(2370, min(2386, len(clean_lines))):
        print(f"Cleaned Line {idx}: '{clean_lines[idx-1]}'")

    stack = []
    stack_history = {}
    tag_pattern = re.compile(r'<(/?[a-zA-Z0-9_-]+)(?:\s+[^>]*?)?(/?)(>)', re.DOTALL)
    
    for match in tag_pattern.finditer(content_clean):
        tag_name = match.group(1)
        is_close = tag_name.startswith('/')
        is_self_closing = match.group(2) == '/'
        
        line_num = content_clean[:match.start()].count('\n') + 1
        
        if is_close:
            tag_name = tag_name[1:]
            
        if is_self_closing or tag_name.lower() in ['input', 'img', 'br', 'hr', 'circle', 'line', 'path', 'defs', 'lineargradient', 'stop', 'meta', 'link', 'rect', 'toast', 'navbar', 'sidebar', 'style', 'counter']:
            continue
            
        if is_close:
            if not stack:
                # print(f"Line {line_num}: Extra closing tag </{tag_name}> found with empty stack")
                continue
            last_tag, last_line = stack.pop()
            if last_tag != tag_name:
                print(f"Line {line_num}: Mismatched closing tag </{tag_name}>, expected </{last_tag}> (opened at line {last_line})")
                stack.append((last_tag, last_line))
        else:
            stack.append((tag_name, line_num))
            
        stack_history[line_num] = [x[0] for x in stack]
        
        if 1335 <= line_num <= 1345:
            print(f"Line {line_num}: Match tag_name='{tag_name}' is_close={is_close} is_self_closing={is_self_closing}")
            
    # Print stack state for checkpoints
    checkpoints = [718, 737, 743, 796, 1342, 2379, 2380, 2481, 2577, 2595, 2769, 2847, 2891]
    for cp in checkpoints:
        valid_keys = [k for k in stack_history.keys() if k <= cp]
        if valid_keys:
            closest_key = max(valid_keys)
            print(f"At line {cp} (closest match line {closest_key}): Stack = {stack_history[closest_key]}")
        else:
            print(f"At line {cp}: No tags processed yet")

if __name__ == '__main__':
    check_jsx_balance('c:/Users/LENOVO/smart_healthcare/frontend/src/pages/AdminDashboard.jsx')
