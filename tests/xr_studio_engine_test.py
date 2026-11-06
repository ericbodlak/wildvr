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

    def test_verify_lod_and_shader_matrix_live_studio(self):
        studio_dir = str(Path(__file__).resolve().parent.parent)
        sync_res = WalkaboutStudioController.sync_inline_bundle(studio_dir)
        self.assertEqual(sync_res["status"], "VALID")
        self.assertTrue(sync_res["synced"])

        matrix = WalkaboutStudioController.verify_lod_and_shader_matrix(studio_dir)
        self.assertEqual(matrix["status"], "VALID")
        self.assertEqual(matrix["lod_tiers"], 4)
        self.assertTrue(matrix["has_side_by_side_lineups"])
        self.assertEqual(matrix["shader_pipelines"], 10)

        skeletal = WalkaboutStudioController.verify_skeletal_loft_and_glb_morph(studio_dir)
        self.assertEqual(skeletal["status"], "VALID")
        self.assertEqual(skeletal["features_found"], skeletal["required_count"])
        self.assertTrue(skeletal["outward_ccw_winding"])

        six_view = WalkaboutStudioController.verify_six_view_reference_and_rig_pipeline(studio_dir)
        self.assertEqual(six_view["status"], "VALID")
        self.assertEqual(six_view["reference_files_found"], six_view["required_files"])
        self.assertEqual(six_view["js_rig_tokens_found"], six_view["required_tokens"])



if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestWalkaboutStudioController)
    result = unittest.TextTestRunner(verbosity=0).run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
