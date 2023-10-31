const { BadRequestError } = require("../expressError");

/**This function helps with making a selective update query.

Functions accepts two paramters:

@param {Object} dataToUpdate The data that is to be updated in an object with key/value pairs for property / table names and values. 
@param {Object} jsToSql Onject with key/value pairs matching keys in dataToUpdate to the correct and associated SQL table names.

@returns {Object} Object including array table names to be used in the update query, and values to be used in the update query with values of the `$` + (index + 1) with = in between as it would be used in the query, and an array of values under the key `values`.

@example sqlForPartialUpdate({firstName: "Pan"}, {firstName: "first_name"}) => 
{
  setCols: ["'first_name'=$1"], 
  values: ["Pan"]
}
*/


function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
