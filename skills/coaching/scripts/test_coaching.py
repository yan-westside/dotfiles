#!/usr/bin/env python3
"""Test suite for coaching skill scripts.

Run: python3 -m pytest test_coaching.py -v
Or:  python3 test_coaching.py  (standalone)
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))


def run_script(name: str, args: list[str] | None = None, env_override: dict | None = None) -> dict:
    """Run a coaching script and return parsed JSON output."""
    cmd = [sys.executable, os.path.join(SCRIPTS_DIR, name)] + (args or [])
    env = os.environ.copy()
    if env_override:
        env.update(env_override)
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {'_raw': result.stdout, '_stderr': result.stderr, '_exit': result.returncode}


class CoachingTestHarness:
    """Temporary coaching directory with sample data for testing."""

    def __init__(self):
        self.tmpdir = tempfile.mkdtemp(prefix='coaching_test_')
        self._create_sample_data()

    def _create_sample_data(self):
        Path(self.tmpdir, 'index.md').write_text("""# Coaching Profile

## Identity
- Role: Test User
- Tenure: 2 years
- Coaching style: direct, framework-oriented
- Last session: 2026-03-15
- Last periodic review: 2026-02-01

## Core Coaching Question
> Am I building the right skills for the next role?

## Career Vision
- **6-month target:** Move to senior level
- **12-month target:** to be refined
- **Long-term direction:** to be refined
- **Last reviewed:** 2026-03-01

## Current Challenges
- **Prioritization:** Too many projects, unclear what matters most

## Strengths (with evidence)
- **Technical depth:** Built a causal inference framework

## Gaps (with evidence)
- **Communication:** Struggles to translate technical work into business impact

## Recent Wins
- Shipped causal framework

## Active Focus Areas
1. Communication
2. Prioritization

## Files
- [Development Areas](development-areas.md)
- [Session Log](session-log.md)
- [Projects](projects.md)
""")

        Path(self.tmpdir, 'development-areas.md').write_text("""# Development Areas

### Communication
**Status:** active
**First identified:** 2026-01-15 — intake
**Evidence:**
- 2026-01-15: Manager flagged as growth area
- 2026-02-10: Presented results without a recommendation
- 2026-03-10: Used hedging language in stakeholder meeting
**Progress:**
- 2026-02-20: Introduced Analysis-to-Recommendation Bridge
**Current practice:** Write "therefore I recommend" before every presentation

### Prioritization
**Status:** active
**First identified:** 2026-01-15 — intake
**Evidence:**
- 2026-01-15: 6 concurrent projects, no clear top 3
- 2026-03-01: Said yes to a new request without evaluating trade-offs
**Progress:**
- 2026-01-20: Introduced Portfolio Cap framework
**Current practice:** Apply Portfolio Cap: max 3 owned projects

### Technical Depth
**Status:** watch
**First identified:** 2026-02-01 — session observation
**Evidence:**
- 2026-02-01: Strong causal inference skills demonstrated
**Progress:**
[To be populated]
**Current practice:** [Not assigned — watch status]
""")

        Path(self.tmpdir, 'session-log.md').write_text("""# Session Log

## 2026-03-15 — Situation — Stakeholder pushback on analysis
**Key insight:** User defaulted to presenting data without a recommendation
**Areas touched:** Communication, Prioritization
**Practice assigned:** Before next stakeholder meeting, write the recommendation first and present it before the analysis

## 2026-03-01 — Review — Progress review
**Key insight:** Communication improving but still inconsistent
**Areas touched:** Communication
**Practice assigned:** Practice the Analysis-to-Recommendation Bridge on the next 3 outputs

## 2026-02-10 — Debrief — Quarterly review meeting
**Key insight:** Missed opportunity to share POV on roadmap
**Areas touched:** Communication
**Practice assigned:** Prepare one concrete recommendation before every meeting with leadership
""")

        Path(self.tmpdir, 'projects.md').write_text("""# Project Portfolio

## Active

### Market Analysis
**Status:** active
**Quarter:** Q1 2026
**Portfolio Slot:** Own #1
**Development Areas:** Communication, Prioritization
**Target Outcome:** Deliver market sizing that changes resource allocation
**Growth Evidence:**
- 2026-03-10: Presented findings to director with a clear recommendation

**Impact:**

### Infrastructure Refactor
**Status:** active
**Quarter:** Q1 2026
**Portfolio Slot:** Own #2
**Development Areas:** Technical Depth
**Target Outcome:** Reduce query time by 50%
**Growth Evidence:**

**Impact:**

## Delegated / Advised

### Dashboard Maintenance
**Status:** delegated
**Quarter:** Q1 2026
**Delegated to:** Junior analyst
**Reason:** Low leverage, routine work

## Shipped

## Cut
""")

    @property
    def env(self):
        return {'COACHING_DIR': self.tmpdir}

    def cleanup(self):
        shutil.rmtree(self.tmpdir, ignore_errors=True)


def test_load_coaching_state():
    h = CoachingTestHarness()
    try:
        result = run_script('load_coaching_state.py', env_override=h.env)
        assert result['status'] == 'loaded'
        assert result['metadata']['total_sessions'] == 3
        assert result['metadata']['active_areas'] == 2
        assert result['metadata']['watch_areas'] == 1
        assert result['metadata']['has_projects'] is True
        assert result['metadata']['project_count'] == 3
    finally:
        h.cleanup()


def test_load_uninitialized():
    env = {'COACHING_DIR': tempfile.mkdtemp(prefix='coaching_empty_')}
    try:
        result = run_script('load_coaching_state.py', env_override=env)
        assert result['status'] == 'not_initialized'
    finally:
        shutil.rmtree(env['COACHING_DIR'], ignore_errors=True)


def test_check_practice_finds_practice():
    h = CoachingTestHarness()
    try:
        result = run_script('check_practice.py', env_override=h.env)
        assert result['status'] == 'has_practice'
        assert 'recommendation' in result['practice'].lower()
        assert result['stats']['total_sessions'] == 3
        assert result['stats']['sessions_with_practice'] == 3
    finally:
        h.cleanup()


def test_check_practice_no_sessions():
    env = {'COACHING_DIR': tempfile.mkdtemp(prefix='coaching_empty_')}
    try:
        result = run_script('check_practice.py', env_override=env)
        assert result['status'] == 'no_sessions'
    finally:
        shutil.rmtree(env['COACHING_DIR'], ignore_errors=True)


def test_count_evidence():
    h = CoachingTestHarness()
    try:
        result = run_script('count_evidence.py', env_override=h.env)
        assert 'areas' in result
        names = [a['name'] for a in result['areas']]
        assert 'Communication' in names
        assert 'Prioritization' in names
        comm = next(a for a in result['areas'] if a['name'] == 'Communication')
        assert comm['total_evidence'] == 3
    finally:
        h.cleanup()


def test_detect_stale():
    h = CoachingTestHarness()
    try:
        result = run_script('detect_stale.py', env_override=h.env)
        assert 'summary' in result
    finally:
        h.cleanup()


def test_project_health():
    h = CoachingTestHarness()
    try:
        result = run_script('project_health.py', env_override=h.env)
        assert result['portfolio_cap']['owned'] == 2
        assert result['portfolio_cap']['status'] == 'ok'
        assert len(result['projects']) == 2
        market = next(p for p in result['projects'] if p['name'] == 'Market Analysis')
        assert market['total_evidence'] == 1
        infra = next(p for p in result['projects'] if p['name'] == 'Infrastructure Refactor')
        assert infra['total_evidence'] == 0
        assert infra['health'] == 'no_evidence'
    finally:
        h.cleanup()


def test_validate_coaching_files():
    h = CoachingTestHarness()
    try:
        result = run_script('validate_coaching_files.py', env_override=h.env)
        assert result['valid'] is True
        assert len(result['errors']) == 0
        assert result['stats']['development_areas'] == 3
    finally:
        h.cleanup()


def test_append_session_log():
    h = CoachingTestHarness()
    try:
        result = run_script('append_session_log.py', [
            '--date', '2026-03-29',
            '--type', 'test',
            '--topic', 'Test session',
            '--insight', 'Test insight',
            '--areas', 'Communication',
            '--practice', 'Test practice',
        ], env_override=h.env)
        assert result['status'] == 'ok'
        assert result['total_full_entries'] == 4

        content = Path(h.tmpdir, 'session-log.md').read_text()
        assert '2026-03-29 — Test — Test session' in content
        assert content.index('2026-03-29') < content.index('2026-03-15')
    finally:
        h.cleanup()


def test_update_index():
    h = CoachingTestHarness()
    try:
        result = run_script('update_index.py', ['--last-session', '2026-03-29'], env_override=h.env)
        assert result['status'] == 'ok'
        content = Path(h.tmpdir, 'index.md').read_text()
        assert 'Last session: 2026-03-29' in content
    finally:
        h.cleanup()


def test_update_index_focus_areas():
    h = CoachingTestHarness()
    try:
        result = run_script('update_index.py', [
            '--focus-areas', 'Communication,Prioritization,Technical Depth',
        ], env_override=h.env)
        assert result['status'] == 'ok'
        content = Path(h.tmpdir, 'index.md').read_text()
        assert '1. Communication' in content
        assert '2. Prioritization' in content
        assert '3. Technical Depth' in content
    finally:
        h.cleanup()


def test_add_project():
    h = CoachingTestHarness()
    try:
        result = run_script('add_project.py', [
            '--name', 'New Project',
            '--quarter', 'Q2 2026',
            '--slot', 'Own #3',
            '--areas', 'Communication',
            '--target', 'Test target',
        ], env_override=h.env)
        assert result['status'] == 'ok'
        content = Path(h.tmpdir, 'projects.md').read_text()
        assert '### New Project' in content
    finally:
        h.cleanup()


def test_add_duplicate_project_fails():
    h = CoachingTestHarness()
    try:
        result = run_script('add_project.py', [
            '--name', 'Market Analysis',
            '--quarter', 'Q2 2026',
        ], env_override=h.env)
        assert 'error' in result
    finally:
        h.cleanup()


def test_update_project_growth():
    h = CoachingTestHarness()
    try:
        result = run_script('update_project.py', [
            '--name', 'Market Analysis',
            '--growth', '2026-03-29: Defended recommendation in front of VP',
        ], env_override=h.env)
        assert result['status'] == 'ok'
        assert 'growth_evidence' in result['updates']
        content = Path(h.tmpdir, 'projects.md').read_text()
        assert 'Defended recommendation' in content
    finally:
        h.cleanup()


def test_update_project_ship():
    h = CoachingTestHarness()
    try:
        result = run_script('update_project.py', [
            '--name', 'Market Analysis',
            '--status', 'shipped',
            '--impact', 'Changed resource allocation across 5 markets',
        ], env_override=h.env)
        assert result['status'] == 'ok'
        content = Path(h.tmpdir, 'projects.md').read_text()
        assert '**Status:** shipped' in content
        assert 'Changed resource allocation' in content
    finally:
        h.cleanup()


def test_update_nonexistent_project_fails():
    h = CoachingTestHarness()
    try:
        result = run_script('update_project.py', [
            '--name', 'Does Not Exist',
            '--growth', 'test',
        ], env_override=h.env)
        assert 'error' in result
    finally:
        h.cleanup()


def test_archive_area():
    h = CoachingTestHarness()
    try:
        result = run_script('archive_area.py', [
            '--area', 'Technical Depth',
            '--reason', 'No longer a priority',
        ], env_override=h.env)
        assert result.get('status') == 'ok' or 'archived' in str(result)
        content = Path(h.tmpdir, 'development-areas.md').read_text()
        assert '**Status:** archived' in content
    finally:
        h.cleanup()


def test_archive_nonexistent_fails():
    h = CoachingTestHarness()
    try:
        result = run_script('archive_area.py', [
            '--area', 'Nonexistent',
            '--reason', 'test',
        ], env_override=h.env)
        assert 'error' in result
    finally:
        h.cleanup()


def test_generate_prep():
    h = CoachingTestHarness()
    try:
        result = run_script('generate_prep.py', env_override=h.env)
        assert result['status'] == 'ok'
        assert len(result['active_projects']) == 2
        assert len(result['development_areas']) >= 2
        assert result['core_question'] != ''
        assert result['last_practice'] is not None
        assert 'recommendation' in result['last_practice']['practice'].lower()
    finally:
        h.cleanup()


def test_parse_transcript():
    transcript = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    try:
        transcript.write(
            "Manager: What do you think about the roadmap?\n"
            "User: Yeah, I think maybe we should sort of look at the data more.\n"
            "Manager: Do you have a recommendation?\n"
            "User: I guess we could try option A, but I'm not sure.\n"
        )
        transcript.close()
        result = run_script('parse_transcript.py', ['--input', transcript.name])
        assert 'speaker_stats' in result
        user_stats = result['speaker_stats'].get('User', {})
        assert user_stats.get('passivity_markers', 0) > 0
        assert user_stats.get('hedging_phrases', 0) > 0
    finally:
        os.unlink(transcript.name)


def test_move_to_wins():
    h = CoachingTestHarness()
    try:
        result = run_script('move_to_wins.py', [
            '--challenge', 'Prioritization',
            '--win', 'Successfully maintained 3-project cap for a full quarter',
        ], env_override=h.env)
        content = Path(h.tmpdir, 'index.md').read_text()
        assert 'Successfully maintained' in content
    finally:
        h.cleanup()


def test_full_session_lifecycle():
    """End-to-end: load -> append session -> update index -> validate."""
    h = CoachingTestHarness()
    try:
        load = run_script('load_coaching_state.py', env_override=h.env)
        assert load['status'] == 'loaded'
        initial_sessions = load['metadata']['total_sessions']

        append = run_script('append_session_log.py', [
            '--date', '2026-03-29',
            '--type', 'situation',
            '--topic', 'Lifecycle test',
            '--insight', 'Testing full flow',
            '--areas', 'Communication',
            '--practice', 'Test practice',
        ], env_override=h.env)
        assert append['status'] == 'ok'
        assert append['total_full_entries'] == initial_sessions + 1

        update = run_script('update_index.py', ['--last-session', '2026-03-29'], env_override=h.env)
        assert update['status'] == 'ok'

        validate = run_script('validate_coaching_files.py', env_override=h.env)
        assert validate['valid'] is True

        reload = run_script('load_coaching_state.py', env_override=h.env)
        assert reload['metadata']['total_sessions'] == initial_sessions + 1
    finally:
        h.cleanup()


def test_parse_rubric():
    """Test parsing of leveling guide sheet data."""
    sample_rows = [
        ["Leveling Guide"],
        ["", "Title", "Analyst", "Data Scientist", "Data Scientist", "Senior Data Scientist", "Lead Data Scientist", "Staff/Principal"],
        ["", "DS Level", "DS0", "DS1", "DS2", "DS3", "DS4", "DS5"],
        ["", "Company Level", "I3", "I4", "I5", "I6", "I7", "I8"],
        ["", "Typical Years", "0-2", "1-3", "4-6", "6-9", "9+", "9+"],
        [],
        ["Measurement", "Technical Capabilities\nTruth Seek", "Basic data pulls", "Reporting and ETL", "Advanced analysis", "Owns measurement strategy", "Implements new capabilities", "Cutting edge methods"],
        ["", "Scope & Complexity\nBe an Owner", "Specific questions", "Narrow product feature", "Loosely defined objectives", "Broad and ambiguous scope", "Clear technical owner", "Top-level company initiative"],
        ["", "Strategy\nCustomer Obsessed", "Initial insights", "Independent insights", "Contributes to roadmaps", "Drives roadmap priorities", "Step-function changes", "Company-level impact"],
    ]

    raw_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    try:
        json.dump(sample_rows, raw_file)
        raw_file.close()
        result = run_script('parse_rubric.py', ['--input', raw_file.name])
        assert 'error' not in result, f'Parse error: {result.get("error")}'
        assert len(result['levels']) == 6, f'Expected 6 levels, got {len(result["levels"])}'
        assert result['levels'][0]['ds_level'] == 'DS0'
        assert result['levels'][5]['ds_level'] == 'DS5'
        assert result['levels'][3]['title'] == 'Senior Data Scientist'
        assert len(result['dimensions']) >= 3, f'Expected >= 3 dimensions, got {len(result["dimensions"])}'
        tech = next(d for d in result['dimensions'] if 'Technical' in d['name'])
        assert 'DS3' in tech['by_level'], 'Missing DS3 in Technical dimension'
        assert 'DS0' in tech['by_level'], 'Missing DS0 in Technical dimension'
    finally:
        os.unlink(raw_file.name)


def test_parse_rubric_with_output_file():
    """Test that parse_rubric.py writes to output file correctly."""
    sample_rows = [
        [""],
        ["", "", "Junior", "Senior"],
        ["", "", "L1", "L2"],
        ["", "", "I1", "I2"],
        [],
        ["", "Skills\nCore", "Basic skills", "Advanced skills"],
    ]

    raw_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    out_file = tempfile.NamedTemporaryFile(suffix='.json', delete=False)
    out_file.close()
    try:
        json.dump(sample_rows, raw_file)
        raw_file.close()
        result = run_script('parse_rubric.py', ['--input', raw_file.name, '--output', out_file.name])
        assert result['status'] == 'ok'
        with open(out_file.name) as f:
            rubric = json.load(f)
        assert len(rubric['levels']) == 2
        assert len(rubric['dimensions']) >= 1
    finally:
        os.unlink(raw_file.name)
        os.unlink(out_file.name)


def test_scan_impact():
    """Test scanning workspace artifacts for impact evidence."""
    project_dir = tempfile.mkdtemp(prefix='coaching_project_')
    try:
        os.makedirs(os.path.join(project_dir, 'outputs'), exist_ok=True)
        os.makedirs(os.path.join(project_dir, 'sql'), exist_ok=True)

        Path(project_dir, 'manifest.md').write_text("""# Test Analysis

## Purpose
Quantify the impact of base pay changes on dasher retention.

## Key Findings
- 1c pay increase drives 0.44% retention lift
- Effect is causal (DoubleML corrected for tip bias)

## Key Artifacts
- `outputs/readout.md` — final readout
- `outputs/results.csv` — regression results
""")

        Path(project_dir, 'outputs', 'readout.md').write_text("""# BP Retention Analysis Readout

## Results
- Treatment effect: +0.44% retention per 1c BP increase
- Statistically significant at p < 0.01
- CPIO impact: -$0.03 per delivery
- Annualized savings: $2.1M
""")

        Path(project_dir, 'outputs', 'results.csv').write_text(
            "metric,estimate,ci_lower,ci_upper,p_value\n"
            "retention_lift,0.0044,0.0021,0.0067,0.002\n"
            "cpio_change,-0.03,-0.05,-0.01,0.008\n"
        )

        Path(project_dir, 'sql', 'analysis.sql').write_text("SELECT 1;")

        result = run_script('scan_impact.py', ['--directory', project_dir])
        assert result['status'] == 'ok', f'Scan failed: {result}'
        assert result['manifest']['exists'] is True
        assert 'retention' in result['manifest']['purpose'].lower()
        assert len(result['manifest']['key_findings']) == 2
        assert result['summary']['markdown_output_count'] == 1
        assert result['summary']['csv_output_count'] == 1

        readout = result['markdown_outputs'][0]
        assert any('0.44%' in v or '2.1M' in v or '$2.1M' in v for v in readout['quantified_values']), \
            f'Expected quantified values, got: {readout["quantified_values"]}'

        csv_out = result['csv_outputs'][0]
        assert 'metric' in csv_out['headers']
        assert csv_out['row_count'] == 2
    finally:
        shutil.rmtree(project_dir, ignore_errors=True)


def test_scan_impact_no_manifest():
    """Test scan_impact handles missing manifest gracefully."""
    project_dir = tempfile.mkdtemp(prefix='coaching_nomanifest_')
    try:
        os.makedirs(os.path.join(project_dir, 'outputs'), exist_ok=True)
        Path(project_dir, 'outputs', 'notes.md').write_text("# Some notes\nResults: 5% lift")

        result = run_script('scan_impact.py', ['--directory', project_dir])
        assert result['status'] == 'ok'
        assert result['manifest']['exists'] is False
        assert result['summary']['markdown_output_count'] == 1
    finally:
        shutil.rmtree(project_dir, ignore_errors=True)


def test_scan_impact_nonexistent_dir():
    """Test scan_impact returns error for missing directory."""
    result = run_script('scan_impact.py', ['--directory', '/tmp/does_not_exist_coaching_test'])
    assert 'error' in result


def test_discover_projects():
    """Test auto-discovery of analysis projects in a workspace."""
    workspace = tempfile.mkdtemp(prefix='coaching_workspace_')
    coaching_dir = os.path.join(workspace, 'coaching')
    os.makedirs(coaching_dir)
    try:
        proj1 = os.path.join(workspace, 'bp_analysis')
        os.makedirs(os.path.join(proj1, 'outputs'))
        os.makedirs(os.path.join(proj1, 'sql'))
        Path(proj1, 'manifest.md').write_text('# BP Analysis\n## Purpose\nTest project')

        proj2 = os.path.join(workspace, 'retention_study')
        os.makedirs(os.path.join(proj2, 'outputs'))
        Path(proj2, 'manifest.md').write_text('# Retention\n## Purpose\nAnother test')

        non_project = os.path.join(workspace, 'random_notes')
        os.makedirs(non_project)
        Path(non_project, 'notes.txt').write_text('just notes')

        skip_dir = os.path.join(workspace, '.cache')
        os.makedirs(skip_dir)

        result = run_script('discover_projects.py', [
            '--workspace', workspace, '--year', '',
        ], env_override={'COACHING_DIR': coaching_dir})
        assert result['status'] == 'ok', f'Discovery failed: {result}'
        assert result['total_discovered'] >= 2, f'Expected >= 2, got {result["total_discovered"]}'
        names = [p['directory'] for p in result['untracked_projects']]
        assert 'bp_analysis' in names, f'bp_analysis not found in {names}'
        assert 'retention_study' in names, f'retention_study not found in {names}'
        assert 'random_notes' not in names
        assert '.cache' not in names
    finally:
        shutil.rmtree(workspace, ignore_errors=True)


ALL_TESTS = [v for k, v in sorted(globals().items()) if k.startswith('test_')]

if __name__ == '__main__':
    passed = 0
    failed = 0
    for test_fn in ALL_TESTS:
        name = test_fn.__name__
        try:
            test_fn()
            print(f'  PASS  {name}')
            passed += 1
        except Exception as e:
            print(f'  FAIL  {name}: {e}')
            failed += 1
    print(f'\n{passed} passed, {failed} failed out of {passed + failed} tests')
    sys.exit(1 if failed else 0)
