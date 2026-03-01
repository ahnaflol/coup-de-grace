/**
 * Fibonacci sphere algorithm — evenly distributes N points on a sphere.
 * Returns [x, y, z][] at the given radius (default 2.15, slightly above
 * the wireframe globe so markers sit on top).
 */
export function distributePoints(
  count: number,
  radius = 2.15,
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1 || 1)) * 2; // range 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;

    points.push([
      Math.cos(theta) * radiusAtY * radius,
      y * radius,
      Math.sin(theta) * radiusAtY * radius,
    ]);
  }

  return points;
}
