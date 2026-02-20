/**
 * $P Point-Cloud Recognizer
 * Based on the $P algorithm by Radu-Daniel Vatavu, Lisa Anthony, and Jacob O. Wobbrock
 * https://depts.washington.edu/acelab/proj/dollar/pdollar.html
 * 
 * Adapted for Greek letter recognition in Sunnie's Classroom Adventures.
 */

class PDollarPoint {
    constructor(x, y, id) {
        this.X = x;
        this.Y = y;
        this.ID = id; // stroke ID
    }
}

class PDollarResult {
    constructor(name, score) {
        this.Name = name;
        this.Score = score;
    }
}

class PointCloud {
    constructor(name, points) {
        this.Name = name;
        this.Points = PDollarRecognizer.Resample(points, PDollarRecognizer.NumPoints);
        PDollarRecognizer.Scale(this.Points);
        PDollarRecognizer.TranslateTo(this.Points, PDollarRecognizer.Origin);
    }
}

class PDollarRecognizer {
    static NumPoints = 32;
    static Origin = new PDollarPoint(0, 0, 0);

    constructor() {
        this.PointClouds = [];
    }

    AddGesture(name, points) {
        this.PointClouds.push(new PointCloud(name, points));
        return this.PointClouds.length;
    }

    Recognize(points) {
        if (points.length === 0) return new PDollarResult('No match', 0);

        const candidate = new PointCloud('candidate', points);
        let bestDistance = Infinity;
        let bestIndex = -1;

        for (let i = 0; i < this.PointClouds.length; i++) {
            const d = PDollarRecognizer.GreedyCloudMatch(candidate.Points, this.PointClouds[i].Points);
            if (d < bestDistance) {
                bestDistance = d;
                bestIndex = i;
            }
        }

        if (bestIndex === -1) return new PDollarResult('No match', 0);

        const score = Math.max((bestDistance - 2.0) / -2.0, 0);
        return new PDollarResult(this.PointClouds[bestIndex].Name, score);
    }

    static GreedyCloudMatch(points1, points2) {
        const n = points1.length;
        const eps = 0.5;
        const step = Math.floor(Math.pow(n, 1.0 - eps));
        let minDistance = Infinity;

        for (let i = 0; i < n; i += step) {
            const d1 = PDollarRecognizer.CloudDistance(points1, points2, i);
            const d2 = PDollarRecognizer.CloudDistance(points2, points1, i);
            minDistance = Math.min(minDistance, Math.min(d1, d2));
        }
        return minDistance;
    }

    static CloudDistance(pts1, pts2, start) {
        const n = pts1.length;
        const matched = new Array(n).fill(false);
        let sum = 0;
        let i = start;

        do {
            let minDist = Infinity;
            let index = -1;
            for (let j = 0; j < n; j++) {
                if (!matched[j]) {
                    const d = PDollarRecognizer.EuclideanDistance(pts1[i], pts2[j]);
                    if (d < minDist) {
                        minDist = d;
                        index = j;
                    }
                }
            }
            matched[index] = true;
            const weight = 1 - ((i - start + n) % n) / n;
            sum += weight * minDist;
            i = (i + 1) % n;
        } while (i !== start);

        return sum;
    }

    static Resample(points, n) {
        const I = PDollarRecognizer.PathLength(points) / (n - 1);
        const newPoints = [points[0]];
        let D = 0;

        for (let i = 1; i < points.length; i++) {
            if (points[i].ID === points[i - 1].ID) {
                const d = PDollarRecognizer.EuclideanDistance(points[i - 1], points[i]);
                if ((D + d) >= I) {
                    const qx = points[i - 1].X + ((I - D) / d) * (points[i].X - points[i - 1].X);
                    const qy = points[i - 1].Y + ((I - D) / d) * (points[i].Y - points[i - 1].Y);
                    const q = new PDollarPoint(qx, qy, points[i].ID);
                    newPoints.push(q);
                    points.splice(i, 0, q);
                    D = 0;
                } else {
                    D += d;
                }
            }
        }

        if (newPoints.length === n - 1) {
            newPoints.push(new PDollarPoint(
                points[points.length - 1].X,
                points[points.length - 1].Y,
                points[points.length - 1].ID
            ));
        }

        // Ensure exactly n points
        while (newPoints.length > n) newPoints.pop();
        while (newPoints.length < n) {
            newPoints.push(new PDollarPoint(
                newPoints[newPoints.length - 1].X,
                newPoints[newPoints.length - 1].Y,
                newPoints[newPoints.length - 1].ID
            ));
        }

        return newPoints;
    }

    static Scale(points) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const p of points) {
            minX = Math.min(minX, p.X);
            maxX = Math.max(maxX, p.X);
            minY = Math.min(minY, p.Y);
            maxY = Math.max(maxY, p.Y);
        }

        const size = Math.max(maxX - minX, maxY - minY);
        for (const p of points) {
            p.X = (size > 0) ? (p.X - minX) / size : 0.5;
            p.Y = (size > 0) ? (p.Y - minY) / size : 0.5;
        }
    }

    static TranslateTo(points, pt) {
        const c = PDollarRecognizer.Centroid(points);
        for (const p of points) {
            p.X += pt.X - c.X;
            p.Y += pt.Y - c.Y;
        }
    }

    static Centroid(points) {
        let x = 0, y = 0;
        for (const p of points) {
            x += p.X;
            y += p.Y;
        }
        return new PDollarPoint(x / points.length, y / points.length, 0);
    }

    static PathLength(points) {
        let d = 0;
        for (let i = 1; i < points.length; i++) {
            if (points[i].ID === points[i - 1].ID) {
                d += PDollarRecognizer.EuclideanDistance(points[i - 1], points[i]);
            }
        }
        return d;
    }

    static EuclideanDistance(p1, p2) {
        const dx = p2.X - p1.X;
        const dy = p2.Y - p1.Y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Export for browser
window.PDollarPoint = PDollarPoint;
window.PDollarRecognizer = PDollarRecognizer;
window.PointCloud = PointCloud;
