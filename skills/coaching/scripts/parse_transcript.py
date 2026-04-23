#!/usr/bin/env python3
"""Parse a transcript into structured data for coaching analysis.

Usage:
    python3 parse_transcript.py --input <file_path>
    python3 parse_transcript.py --text "<transcript text>"

Output: JSON with speaker stats, passivity markers, hedging phrases, etc.
"""

import argparse
import json
import re
import sys
from collections import Counter, defaultdict


# Passivity markers — words/phrases that signal agreement without engagement
PASSIVITY_MARKERS = [
    r'\byeah\b', r'\bokay\b', r'\bok\b', r'\bright\b', r'\bsure\b',
    r'\bmm-?hm\b', r'\buh-?huh\b', r'\bgot it\b', r'\bmakes sense\b',
    r'\btotally\b', r'\babsolutely\b', r'\bfor sure\b', r'\bdefinitely\b',
    r'\byep\b', r'\byup\b',
]

# Hedging phrases — signal lack of conviction
HEDGING_PHRASES = [
    r'\bi think maybe\b', r'\bsort of\b', r'\bkind of\b', r'\bkinda\b',
    r'\bmaybe\b', r'\bprobably\b', r'\bi guess\b', r'\bi feel like\b',
    r'\bnot sure\b', r'\bi don\'t know\b', r'\bpossibly\b',
    r'\bit seems like\b', r'\bit might\b', r'\bcould be\b',
    r'\bjust wondering\b', r'\bjust thinking\b',
]

# Filler words
FILLER_WORDS = [
    r'\bum\b', r'\buh\b', r'\blike\b', r'\byou know\b', r'\bi mean\b',
    r'\bbasically\b', r'\bactually\b', r'\bhonestly\b',
]


def parse_speakers(text: str) -> list[dict]:
    """Parse transcript into speaker turns.

    Supports formats:
    - "Speaker Name: text"
    - "[Speaker Name] text"
    - "Speaker Name\ntext" (Granola/Otter style with name on own line)
    """
    turns = []

    # Try "Speaker: text" format first
    pattern = r'^([A-Z][a-zA-Z\s\.\-\']+?):\s*(.+?)(?=^[A-Z][a-zA-Z\s\.\-\']+?:\s|\Z)'
    matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)

    if matches:
        for speaker, content in matches:
            content = content.strip()
            if content:
                turns.append({'speaker': speaker.strip(), 'text': content})
        return turns

    # Try "[Speaker] text" format
    pattern = r'\[([^\]]+)\]\s*(.+?)(?=\[[^\]]+\]|\Z)'
    matches = re.findall(pattern, text, re.DOTALL)

    if matches:
        for speaker, content in matches:
            content = content.strip()
            if content:
                turns.append({'speaker': speaker.strip(), 'text': content})
        return turns

    # Fallback: treat entire text as single turn from "Unknown"
    if text.strip():
        turns.append({'speaker': 'Unknown', 'text': text.strip()})

    return turns


def count_pattern_matches(text: str, patterns: list[str]) -> int:
    """Count total matches of a list of regex patterns in text."""
    count = 0
    text_lower = text.lower()
    for pattern in patterns:
        count += len(re.findall(pattern, text_lower))
    return count


def get_pattern_instances(text: str, patterns: list[str]) -> list[str]:
    """Get actual matched strings for a list of patterns."""
    instances = []
    text_lower = text.lower()
    for pattern in patterns:
        for match in re.finditer(pattern, text_lower):
            instances.append(match.group())
    return instances


def count_questions(text: str) -> int:
    """Count question marks (proxy for questions asked)."""
    return text.count('?')


def word_count(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def analyze_transcript(turns: list[dict]) -> dict:
    """Produce full analysis of parsed transcript turns."""
    if not turns:
        return {'error': 'No turns parsed from transcript'}

    speakers = list(dict.fromkeys(t['speaker'] for t in turns))
    total_turns = len(turns)

    # Per-speaker stats
    speaker_stats = {}
    for speaker in speakers:
        speaker_turns = [t for t in turns if t['speaker'] == speaker]
        all_text = ' '.join(t['text'] for t in speaker_turns)
        turn_count = len(speaker_turns)
        words = word_count(all_text)

        speaker_stats[speaker] = {
            'turn_count': turn_count,
            'turn_ratio': round(turn_count / total_turns, 2) if total_turns > 0 else 0,
            'total_words': words,
            'avg_words_per_turn': round(words / turn_count, 1) if turn_count > 0 else 0,
            'questions_asked': count_questions(all_text),
            'passivity_markers': count_pattern_matches(all_text, PASSIVITY_MARKERS),
            'passivity_marker_examples': get_pattern_instances(all_text, PASSIVITY_MARKERS)[:10],
            'hedging_phrases': count_pattern_matches(all_text, HEDGING_PHRASES),
            'hedging_phrase_examples': get_pattern_instances(all_text, HEDGING_PHRASES)[:10],
            'filler_words': count_pattern_matches(all_text, FILLER_WORDS),
        }

        # Calculate passivity density (markers per 100 words)
        if words > 0:
            speaker_stats[speaker]['passivity_density'] = round(
                speaker_stats[speaker]['passivity_markers'] / words * 100, 1
            )
            speaker_stats[speaker]['hedging_density'] = round(
                speaker_stats[speaker]['hedging_phrases'] / words * 100, 1
            )
        else:
            speaker_stats[speaker]['passivity_density'] = 0
            speaker_stats[speaker]['hedging_density'] = 0

    # Conversation dynamics
    # Track turn length over time (first half vs second half)
    midpoint = total_turns // 2
    first_half = turns[:midpoint] if midpoint > 0 else turns
    second_half = turns[midpoint:] if midpoint > 0 else []

    dynamics = {}
    for speaker in speakers:
        fh_turns = [t for t in first_half if t['speaker'] == speaker]
        sh_turns = [t for t in second_half if t['speaker'] == speaker]
        fh_text = ' '.join(t['text'] for t in fh_turns)
        sh_text = ' '.join(t['text'] for t in sh_turns)

        fh_passivity = count_pattern_matches(fh_text, PASSIVITY_MARKERS)
        sh_passivity = count_pattern_matches(sh_text, PASSIVITY_MARKERS)

        dynamics[speaker] = {
            'first_half_avg_words': round(word_count(fh_text) / len(fh_turns), 1) if fh_turns else 0,
            'second_half_avg_words': round(word_count(sh_text) / len(sh_turns), 1) if sh_turns else 0,
            'first_half_passivity': fh_passivity,
            'second_half_passivity': sh_passivity,
        }

    return {
        'speakers': speakers,
        'total_turns': total_turns,
        'speaker_stats': speaker_stats,
        'dynamics': dynamics,
    }


def main():
    parser = argparse.ArgumentParser(description='Parse coaching transcript')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--input', help='Path to transcript file')
    group.add_argument('--text', help='Raw transcript text')
    args = parser.parse_args()

    if args.input:
        try:
            with open(args.input, 'r') as f:
                text = f.read()
        except FileNotFoundError:
            print(json.dumps({'error': f'File not found: {args.input}'}))
            sys.exit(1)
    else:
        text = args.text

    if not text or not text.strip():
        print(json.dumps({'error': 'Empty transcript'}))
        sys.exit(1)

    turns = parse_speakers(text)
    analysis = analyze_transcript(turns)
    print(json.dumps(analysis, indent=2))


if __name__ == '__main__':
    main()
