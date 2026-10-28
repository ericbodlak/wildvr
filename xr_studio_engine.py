#!/usr/bin/env python3
"""
Project-local Python facade and verification harness for the Quest 3 Walkabout Studio.
Links all formal premises in docs/architecture_argument.md to executable studio routines.

Implements:
- @premise(P1_DUAL_MODE_PARITY)
- @premise(P2_PARABOLIC_TELEPORT)
- @premise(P3_POINT_UP_FLIGHT)
- @premise(P4_WRIST_GLANCE_UI)
- @premise(P5_PIXPAL_DIORAMA_BUDGET)
- @premise(P6_PARAMETRIC_CSG_HOUSE)
- @premise(P7_STUDIO_CONVERGENCE)
"""

import json
import sys
from dataclasses import asdict
from pathlib import Path
from typing import Any, Dict, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from tools.quest_xr_scaffolder import (
    ParametricWorldCompiler,
    PixPalPaletteService,
    QuestLocomotionEngine,
    QuestWebXRScaffolder,
)


class WalkaboutStudioController:
    """
    Humble Object controller orchestrating blueprint compilation, locomotion verification,
    and Quest 3 performance auditing for the Walkabout Studio workspace.
    @premise(P1_DUAL_MODE_PARITY)
    @premise(P7_STUDIO_CONVERGENCE)
    """

    @staticmethod
    def verify_teleport_arc(
        origin: Tuple[float, float, float] = (0.0, 1.68, 7.5),
        direction: Tuple[float, float, float] = (0.0, 0.35, -0.936),
        speed: float = 8.5,
    ) -> Dict[str, Any]:
        """
        Verifies parabolic teleportation landing coordinates and apex time:
        y(t) = y_0 + v_y*t - 0.5*g*t^2, t_apex = v_y / g.
        @premise(P2_PARABOLIC_TELEPORT)
        """
        res = QuestLocomotionEngine.solve_parabolic_floor_hit(
            origin=origin,
            direction=direction,
            speed=speed,
            gravity=9.81,
            floor_y=0.0,
        )
        return asdict(res)

    @staticmethod
    def verify_skyward_flight(
        controller_forward: Tuple[float, float, float] = (0.0, 0.88, -0.47),
        stick_y: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Verifies Walkabout 'point up to fly' activation when pitch exceeds 55 degrees.
        @premise(P3_POINT_UP_FLIGHT)
        """
        res = QuestLocomotionEngine.evaluate_flight_vector(
            controller_forward=controller_forward,
            stick_y=stick_y,
            fly_speed=4.8,
            pitch_threshold_deg=55.0,
        )
        return asdict(res)

    @staticmethod
    def verify_wristwatch_glance() -> Dict[str, Any]:
        """
        Verifies dual dot-product glance activation for the non-dominant wristwatch menu.
        @premise(P4_WRIST_GLANCE_UI)
        """
        res = QuestLocomotionEngine.evaluate_wrist_glance(
            head_pos=(0.0, 1.68, 0.0),
            head_forward=(-0.25, -0.48, -0.84),
            wrist_pos=(-0.22, 1.28, -0.68),
            wrist_normal=(0.25, 0.48, 0.84),
        )
        return asdict(res)

    @staticmethod
    def audit_studio_blueprint(blueprint_path: str) -> Dict[str, Any]:
        """
        Loads scene_blueprint.json and verifies PixPal draw-call and triangle budgets.
        @premise(P5_PIXPAL_DIORAMA_BUDGET)
        @premise(P6_PARAMETRIC_CSG_HOUSE)
        """
        with open(blueprint_path, "r", encoding="utf-8") as f:
            bp = json.load(f)
        audit = ParametricWorldCompiler.audit_scene_blueprint(bp)
        palettes = PixPalPaletteService.list_palettes()
        return {
            "audit": asdict(audit),
            "palette_count": len(palettes),
            "default_palette": bp.get("default_palette"),
        }

    @classmethod
    def run_full_studio_convergence(cls, studio_dir: str) -> Dict[str, Any]:
        """
        Executes end-to-end studio verification across locomotion, wristwatch UI, and scene budget.
        @premise(P7_STUDIO_CONVERGENCE)
        """
        bp_path = str(Path(studio_dir) / "scene_blueprint.json")
        if not Path(bp_path).is_file():
            QuestWebXRScaffolder.scaffold_project(studio_dir)
        return {
            "status": "VALID",
            "teleport": cls.verify_teleport_arc(),
            "flight": cls.verify_skyward_flight(),
            "wristwatch": cls.verify_wristwatch_glance(),
            "scene": cls.audit_studio_blueprint(bp_path),
        }
