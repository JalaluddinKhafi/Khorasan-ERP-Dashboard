  }
});

test("CSV escapes formulas after whitespace and keeps normal text", async () => {
  const originalDocument = global.document;
  const originalCreate = URL.createObjectURL;
  let exported;
  try {
    global.document = { createElement: () => ({ click() {} }) };
    URL.createObjectURL = (blob) => { exported = blob; return "blob:test"; };
    const { downloadCsv } = await service();
    downloadCsv("test", [["=1+1", "  =1+1", "\t@SUM(1)", "\rtext", "normal", 'a"b', "خراسان", "-10"]]);
    assert.equal(await exported.text(), '"\'=1+1","\'  =1+1","\'\t@SUM(1)","\'\rtext","normal","a""b","خراسان","\'-10"');
  } finally {
    global.document = originalDocument;
    URL.createObjectURL = originalCreate;
  }
});
