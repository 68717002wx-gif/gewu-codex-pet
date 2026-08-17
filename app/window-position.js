function clampWindowMove(bounds, workArea, dx = 0, dy = 0, margin = 8) {
  const minX = workArea.x + margin;
  const minY = workArea.y + margin;
  const maxX = Math.max(minX, workArea.x + workArea.width - bounds.width - margin);
  const maxY = Math.max(minY, workArea.y + workArea.height - bounds.height - margin);
  const nextX = Math.min(Math.max(bounds.x + Math.round(Number(dx) || 0), minX), maxX);
  const nextY = Math.min(Math.max(bounds.y + Math.round(Number(dy) || 0), minY), maxY);
  return { x: nextX, y: nextY };
}

module.exports = { clampWindowMove };
