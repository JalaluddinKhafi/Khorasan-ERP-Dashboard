}
assert.equal(total, schedule.reduce((sum, day) => sum + day.count, 0));
assert.ok([...actual.keys()].every((date) => schedule.some((day) => day.date === date)));
console.log(`PASS: ${total} non-empty commits, 121 active days, 8 idle days, 12–30 commits per active day, Kabul dates.`);
