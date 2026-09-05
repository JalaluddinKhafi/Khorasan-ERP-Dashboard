  assert.ok(authorDate.endsWith("+0430") && commitDate.endsWith("+0430"));
  const date = new Date(Number(commitTime) * 1000 + 270 * 60000).toISOString().slice(0, 10);
  actual.set(date, (actual.get(date) || 0) + 1);
  previousTime = Number(commitTime);
  previousTree = tree;
  total++;
}
for (const day of schedule) {
  assert.ok(day.count === 0 || (day.count >= 12 && day.count <= 30));
  assert.equal(actual.get(day.date) || 0, day.count, day.date);
}
assert.equal(total, schedule.reduce((sum, day) => sum + day.count, 0));
assert.ok([...actual.keys()].every((date) => schedule.some((day) => day.date === date)));
console.log(`PASS: ${total} non-empty commits, 121 active days, 8 idle days, 12–30 commits per active day, Kabul dates.`);
