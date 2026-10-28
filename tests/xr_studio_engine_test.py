#!/usr/bin/env python3
"""
Companion unit test suite for projects/wild_vr_studio/xr_studio_engine.py.
"""

import sys
import tempfile
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from projects.wild_vr_studio.xr_studio_engine import WalkaboutStudioController


class TestWalkaboutStudioController(unittest.TestCase):
    """Isolated tests for WalkaboutStudioController."""

    def test_verify_teleport_flight_and_wristwatch(self):
        tp = WalkaboutStudioController.verify_teleport_arc()
        self.assertTrue(tp["hit"])
        self.assertTrue(tp["surface_valid"])

        fl = WalkaboutStudioController.verify_skyward_flight()
        self.assertTrue(fl["is_flying"])
        self.assertGreater(fl["pitch_deg"], 55.0)

        ww = WalkaboutStudioController.verify_wristwatch_glance()
        self.assertTrue(ww["is_active"])
        self.assertEqual(ww["target_scale"], 1.0)

    def test_run_full_studio_convergence(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = WalkaboutStudioController.run_full_studio_convergence(tmp)
            self.assertEqual(report["status"], "VALID")
            self.assertEqual(report["scene"]["audit"]["status"], "VALID")
            self.assertEqual(report["scene"]["palette_count"], 4)
            self.assertTrue((Path(tmp) / "index.html").is_file())


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestWalkaboutStudioController)
    result = unittest.TextTestRunner(verbosity=0).run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
