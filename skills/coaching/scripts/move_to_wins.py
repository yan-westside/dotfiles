#!/usr/bin/env python3
"""Move a resolved challenge from Current Challenges to Recent Wins in index.md.

Usage:
    python3 move_to_wins.py --challenge "challenge text or substring" --win "what happened"
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from coaching_config import INDEX_PATH

TODAY = datetime.now().strftime('%Y-%m-%d')


def main():
    parser = argparse.ArgumentParser(description='Move challenge to wins')
    parser.add_argument('--challenge', required=True, help='Challenge text or substring to match')
    parser.add_argument('--win', required=True, help='Description of the win')
    args = parser.parse_args()

    if not os.path.exists(INDEX_PATH):
        print(json.dumps({'error': 'index.md not found'}))
        sys.exit(1)

    with open(INDEX_PATH, 'r') as f:
        content = f.read()

    # Find and remove the challenge line
    lines = content.split('\n')
    new_lines = []
    removed_challenge = None
    in_challenges = False
    in_wins = False
    win_inserted = False

    for line in lines:
        stripped = line.strip()

        # Track sections
        if stripped.startswith('## Current Challenges'):
            in_challenges = True
            in_wins = False
            new_lines.append(line)
            continue
        elif stripped.startswith('## Recent Wins'):
            in_challenges = False
            in_wins = True
            new_lines.append(line)
            # Insert win entry right after the section header
            # But we need to handle existing content, so we'll insert after processing
            continue
        elif stripped.startswith('## ') and not stripped.startswith('###'):
            if in_wins and not win_inserted:
                # Insert before leaving wins section
                new_lines.append(f'- {TODAY}: {args.win} — moved from: challenge')
                win_inserted = True
            in_challenges = False
            in_wins = False

        # Remove matching challenge
        if in_challenges and stripped.startswith('- ') and args.challenge.lower() in stripped.lower():
            removed_challenge = stripped
            continue  # Skip this line (remove it)

        # Insert win in Recent Wins section
        if in_wins and not win_inserted and (stripped.startswith('- ') or stripped == '' or stripped.startswith('[')):
            new_lines.append(f'- {TODAY}: {args.win} — moved from: challenge')
            win_inserted = True

        new_lines.append(line)

    # If we're still in wins section at end of file and haven't inserted
    if in_wins and not win_inserted:
        new_lines.append(f'- {TODAY}: {args.win} — moved from: challenge')
        win_inserted = True

    if removed_challenge is None:
        print(json.dumps({'error': f'Challenge not found matching: {args.challenge}'}))
        sys.exit(1)

    content = '\n'.join(new_lines)

    with open(INDEX_PATH, 'w') as f:
        f.write(content)

    print(json.dumps({
        'status': 'ok',
        'removed_challenge': removed_challenge,
        'win_added': f'{TODAY}: {args.win}',
    }))


if __name__ == '__main__':
    main()
