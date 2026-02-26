"use client";

import { useEffect, useRef } from "react";
import Konva from "konva";

interface AstronautWorkflowProps {
    width?: number;
    height?: number;
}

/**
 * AstronautWorkflow Component
 * 
 * An interactive, animated Konva-based visualization of an API flow.
 * Recreates the user's reference line-art style with application themes.
 * Features: Floating astronaut, pulsing flames, data pulse along paths, and glowing stars.
 */
export default function AstronautWorkflow({ width = 500, height = 500 }: AstronautWorkflowProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Use application brand colors
        const colors = {
            primary: "#00D1FF", // Cyan
            secondary: "#FF6B00", // Orange
            accent: "#FFD700", // Gold
            bg: "transparent",
            nodeFill: "#ffffff",
            nodeStroke: "#b0bec5",
            textGray: "#90a4ae",
            linkGray: "#90a4ae",
        };

        const stage = new Konva.Stage({
            container: containerRef.current,
            width: width,
            height: height,
        });
        stageRef.current = stage;

        // Background Layer
        const bgLayer = new Konva.Layer();
        stage.add(bgLayer);

        const mainLayer = new Konva.Layer();
        stage.add(mainLayer);

        // Scaling factor (base design is for 500x500)
        const scale = width / 500;
        mainLayer.scale({ x: scale, y: scale });

        // ─── Helper: rounded rect node ───
        interface NodeConfig {
            x: number;
            y: number;
            w: number;
            h: number;
            fill?: string;
            stroke?: string;
            strokeWidth?: number;
            cornerRadius?: number;
        }

        function makeNode({
            x,
            y,
            w,
            h,
            fill = colors.nodeFill,
            stroke = colors.nodeStroke,
            strokeWidth = 2,
            cornerRadius = 8,
        }: NodeConfig): Konva.Group {
            const g = new Konva.Group({ x, y });
            g.add(
                new Konva.Rect({
                    x: 0,
                    y: 0,
                    width: w,
                    height: h,
                    fill,
                    stroke,
                    strokeWidth,
                    cornerRadius,
                    shadowColor: colors.textGray,
                    shadowBlur: 8,
                    shadowOpacity: 0.2,
                    shadowOffset: { x: 2, y: 3 },
                })
            );
            return g;
        }

        // ─── Helper: line ───
        function makeLine(points: number[], dash = false): Konva.Line {
            return new Konva.Line({
                points,
                stroke: colors.linkGray,
                strokeWidth: 2,
                dash: dash ? [6, 4] : undefined,
                lineCap: "round",
                lineJoin: "round",
            });
        }

        // ─── Nodes layout ───
        // Top-left node (dashed border)
        const n1 = makeNode({
            x: 60,
            y: 80,
            w: 90,
            h: 36,
            fill: "rgba(0, 209, 255, 0.05)",
            stroke: colors.primary,
            strokeWidth: 2,
        });
        (n1.findOne("Rect") as Konva.Rect).dash([5, 3]);
        n1.add(
            new Konva.Rect({ x: 10, y: 12, width: 50, height: 8, fill: colors.primary, cornerRadius: 4, opacity: 0.3 })
        );

        // Top-right node (green header -> cyan header)
        const n2 = makeNode({ x: 330, y: 60, w: 120, h: 70 });
        n2.add(
            new Konva.Rect({ x: 0, y: 0, width: 120, height: 22, fill: "rgba(0, 209, 255, 0.2)", cornerRadius: [8, 8, 0, 0] })
        );
        n2.add(new Konva.Rect({ x: 10, y: 30, width: 80, height: 7, fill: "#cfd8dc", cornerRadius: 3 }));
        n2.add(new Konva.Rect({ x: 10, y: 44, width: 55, height: 7, fill: "#cfd8dc", cornerRadius: 3 }));

        // Mid-left large node
        const n3 = makeNode({ x: 30, y: 200, w: 130, h: 80 });
        n3.add(
            new Konva.Rect({ x: 0, y: 0, width: 130, height: 20, fill: "rgba(0, 209, 255, 0.1)", cornerRadius: [8, 8, 0, 0] })
        );
        n3.add(new Konva.Rect({ x: 10, y: 30, width: 90, height: 7, fill: "#cfd8dc", cornerRadius: 3 }));
        n3.add(new Konva.Rect({ x: 10, y: 45, width: 65, height: 7, fill: "#cfd8dc", cornerRadius: 3 }));

        // Mid-right small node
        const n4 = makeNode({ x: 370, y: 195, w: 80, h: 36 });
        n4.add(new Konva.Rect({ x: 10, y: 14, width: 55, height: 8, fill: "#cfd8dc", cornerRadius: 3 }));

        // Bottom-left node
        const n5 = makeNode({ x: 55, y: 360, w: 100, h: 32 });
        n5.add(new Konva.Rect({ x: 10, y: 12, width: 70, height: 8, fill: "#cfd8dc", cornerRadius: 3 }));

        // Bottom-right small node
        const n6 = makeNode({ x: 350, y: 315, w: 80, h: 30 });
        n6.add(new Konva.Rect({ x: 10, y: 11, width: 55, height: 8, fill: "#cfd8dc", cornerRadius: 3 }));

        // ─── Play button ───
        const playGroup = new Konva.Group({ x: 185, y: 155 });
        playGroup.add(
            new Konva.Rect({
                x: 0,
                y: 0,
                width: 60,
                height: 60,
                fill: colors.secondary,
                cornerRadius: 12,
                shadowColor: "#000",
                shadowBlur: 14,
                shadowOpacity: 0.2,
                shadowOffset: { x: 0, y: 4 },
            })
        );
        playGroup.add(
            new Konva.RegularPolygon({ x: 33, y: 30, sides: 3, radius: 14, fill: "#ffffff", rotation: 90 })
        );

        // Sparks around play button
        const sparks = [
            { x: 20, y: -12, angle: -45 },
            { x: 30, y: -14, angle: 0 },
            { x: 40, y: -12, angle: 45 },
        ];
        sparks.forEach((s) => {
            playGroup.add(
                new Konva.Line({
                    points: [
                        s.x,
                        s.y,
                        s.x + Math.sin((s.angle * Math.PI) / 180) * 10,
                        s.y - Math.cos((s.angle * Math.PI) / 180) * 10,
                    ],
                    stroke: colors.accent,
                    strokeWidth: 3,
                    lineCap: "round",
                })
            );
        });

        // ─── Astronaut body ───
        const astroGroup = new Konva.Group({ x: 230, y: 220 });
        // Head & Body
        astroGroup.add(
            new Konva.Ellipse({
                x: 25, y: 55, radiusX: 28, radiusY: 35,
                fill: "#fdfdfd", stroke: colors.nodeStroke, strokeWidth: 2,
            })
        );
        astroGroup.add(
            new Konva.Circle({ x: 25, y: 18, radius: 22, fill: "#fdfdfd", stroke: colors.nodeStroke, strokeWidth: 2 })
        );
        // Visor
        astroGroup.add(
            new Konva.Ellipse({
                x: 25, y: 17, radiusX: 13, radiusY: 11,
                fill: "rgba(0, 209, 255, 0.1)", stroke: colors.primary, strokeWidth: 1.5,
            })
        );
        // Detail on suit
        astroGroup.add(
            new Konva.Rect({
                x: 16, y: 48, width: 18, height: 18,
                fill: "rgba(0, 209, 255, 0.05)", cornerRadius: 3, stroke: colors.primary, strokeWidth: 1,
            })
        );
        // Arms
        astroGroup.add(
            new Konva.Line({ points: [-3, 45, -22, 18], stroke: colors.nodeStroke, strokeWidth: 10, lineCap: "round" })
        );
        astroGroup.add(
            new Konva.Line({ points: [53, 45, 72, 65], stroke: colors.nodeStroke, strokeWidth: 10, lineCap: "round" })
        );
        // Legs
        astroGroup.add(
            new Konva.Line({ points: [15, 88, 10, 115], stroke: colors.nodeStroke, strokeWidth: 9, lineCap: "round" })
        );
        astroGroup.add(
            new Konva.Line({ points: [35, 88, 40, 115], stroke: colors.nodeStroke, strokeWidth: 9, lineCap: "round" })
        );
        // Jetpack flames
        const flame1 = new Konva.Ellipse({
            x: 14, y: 122, radiusX: 5, radiusY: 10, fill: colors.secondary, opacity: 0.9,
        });
        const flame2 = new Konva.Ellipse({
            x: 38, y: 122, radiusX: 5, radiusY: 10, fill: colors.primary, opacity: 0.9,
        });
        astroGroup.add(flame1);
        astroGroup.add(flame2);

        // ─── Connecting lines ───
        const linesPoints = [
            makeLine([150, 98, 185, 175], true),
            makeLine([330, 95, 245, 175]),
            makeLine([160, 240, 258, 270]),
            makeLine([370, 213, 305, 270]),
            makeLine([105, 360, 265, 340]),
            makeLine([350, 330, 305, 330]),
            makeLine([30, 280, 55, 320]),
        ];

        // ─── Sparkle stars ───
        function makeStar(x: number, y: number, size = 12): Konva.Group {
            const g = new Konva.Group({ x, y });
            [0, 90].forEach((angle) => {
                g.add(
                    new Konva.Line({
                        points: [-size / 2, 0, size / 2, 0],
                        stroke: colors.accent,
                        strokeWidth: 2.5,
                        lineCap: "round",
                        rotation: angle,
                    })
                );
            });
            [45, 135].forEach((angle) => {
                g.add(
                    new Konva.Line({
                        points: [-(size * 0.35), 0, size * 0.35, 0],
                        stroke: colors.accent,
                        strokeWidth: 2,
                        lineCap: "round",
                        rotation: angle,
                    })
                );
            });
            return g;
        }

        const star1 = makeStar(155, 240);
        const star2 = makeStar(410, 195, 10);
        const star3 = makeStar(250, 390, 9);

        // ─── Add everything to layer ───
        linesPoints.forEach((l) => mainLayer.add(l));
        [n1, n2, n3, n4, n5, n6].forEach((n) => mainLayer.add(n));
        mainLayer.add(playGroup);
        mainLayer.add(astroGroup);
        mainLayer.add(star1);
        mainLayer.add(star2);
        mainLayer.add(star3);

        mainLayer.draw();

        // ─── Animations ───
        const floatAnim = new Konva.Animation((frame) => {
            if (!frame) return;
            const t = frame.time / 1000;
            astroGroup.y(220 + Math.sin(t * 1.5) * 8);
        }, mainLayer);
        floatAnim.start();

        const flameAnim = new Konva.Animation((frame) => {
            if (!frame) return;
            const t = frame.time / 1000;
            const scale = 0.8 + Math.abs(Math.sin(t * 8)) * 0.5;
            flame1.scaleY(scale);
            flame2.scaleY(scale * 0.9 + 0.1);
            flame1.fill(Math.sin(t * 10) > 0 ? colors.secondary : colors.accent);
            flame2.fill(Math.sin(t * 12) > 0 ? colors.primary : colors.secondary);
        }, mainLayer);
        flameAnim.start();

        const pulseAnim = new Konva.Animation((frame) => {
            if (!frame) return;
            const t = frame.time / 1000;
            const s = 1 + Math.sin(t * 2.5) * 0.07;
            playGroup.scaleX(s);
            playGroup.scaleY(s);
            playGroup.offsetX((s - 1) * 30);
            playGroup.offsetY((s - 1) * 30);
        }, mainLayer);
        pulseAnim.start();

        const starAnim = new Konva.Animation((frame) => {
            if (!frame) return;
            const t = frame.time / 1000;
            star1.opacity(0.5 + Math.abs(Math.sin(t * 2)) * 0.5);
            star2.opacity(0.5 + Math.abs(Math.sin(t * 2.5 + 1)) * 0.5);
            star3.opacity(0.5 + Math.abs(Math.sin(t * 3 + 2)) * 0.5);
            star1.rotation(t * 30);
            star2.rotation(-t * 25);
            star3.rotation(t * 20);
        }, mainLayer);
        starAnim.start();

        // Data pulse dot along connecting lines
        const dotLayer = new Konva.Layer();
        stage.add(dotLayer);
        dotLayer.scale({ x: scale, y: scale });
        const dot = new Konva.Circle({ x: 0, y: 0, radius: 4, fill: colors.primary, opacity: 0.8 });
        dotLayer.add(dot);

        const pathPoints: [number, number][] = [
            [150, 98], [185, 175],
            [185, 175], [245, 175],
            [245, 175], [258, 270],
            [258, 270], [265, 340],
            [265, 340], [105, 360],
        ];
        let segIdx = 0;
        let progress = 0;

        const dotAnim = new Konva.Animation((frame) => {
            if (!frame) return;
            progress += frame.timeDiff / 800; // Slower, smoother pulse
            if (progress >= 1) {
                progress = 0;
                segIdx = (segIdx + 1) % (pathPoints.length - 1);
            }
            const [x1, y1] = pathPoints[segIdx];
            const [x2, y2] = pathPoints[segIdx + 1];
            dot.x(x1 + (x2 - x1) * progress);
            dot.y(y1 + (y2 - y1) * progress);
            dotLayer.batchDraw();
        }, dotLayer);
        dotAnim.start();

        return () => {
            floatAnim.stop();
            flameAnim.stop();
            pulseAnim.stop();
            starAnim.stop();
            dotAnim.stop();
            stage.destroy();
        };
    }, [width, height]);

    return (
        <div
            ref={containerRef}
            className="flex items-center justify-center pointer-events-none"
            style={{
                width: width,
                height: height,
                backgroundColor: "transparent",
            }}
        />
    );
}
