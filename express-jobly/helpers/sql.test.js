const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");


describe("sqlForPartialUpdate", function () {
    test("Returns correct values", function () {
      const result = sqlForPartialUpdate(
          { key: "val" },
          { key: "key1", key1: "key2" });
      expect(result).toEqual({
        setCols: `"key1"=$1`,
        values: ["val"],
      });
    });
  
    test("Throws error if no data", function () {
        function noData () {
            const result = sqlForPartialUpdate(
                { },
                { key: "key1", key1: "key2"  });
        }
      expect(noData).toThrow(BadRequestError);
    });
  });