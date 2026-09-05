    assert.equal(await exported.text(), '"\'=1+1","\'  =1+1","\'\t@SUM(1)","\'\rtext","normal","a""b","خراسان","\'-10"');
  } finally {
    global.document = originalDocument;
    URL.createObjectURL = originalCreate;
  }
});
