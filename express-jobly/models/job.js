"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle,
        ],
    );
    const createdJob = result.rows[0];

    return createdJob;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * 
   * If filters of salary, equity, name are passed in to the function, adjusts the query accordingly by concatenating strings to the database query. By default, the query string filters are set to an empty Object.
   * */

  static async findAll(queryStringFilters = {}) {
    let query =`SELECT j.id, 
                j.title,
                j.salary,
                j.equity,
                j.company_handle AS "companyHandle",
                c.name AS "companyName"
        FROM jobs as j
        LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    
    const { minSalary, hasEquity, title } = queryStringFilters;
    let filterStatements = [];
    let filterValues = [];

    if (minSalary < 0) {
      throw new BadRequestError("Min salary cannot be less than zero");
    }

    // Filter values are put into the query string using the $some_num syntax with some_num being generated based on the length of the filterValues array.

    if (minSalary) {
      filterValues.push(minSalary);
      filterStatements.push(`salary >= $${filterValues.length}`);
    }
    if (hasEquity) {
      filterStatements.push(`equity > 0`);
    }
    if (title) {
      filterValues.push(`%${title}%`);
      filterStatements.push(`title ILIKE $${filterValues.length}`);
    }
    // As long as filters have been passed into the function, the query will be altered accordingly.

    if (filterStatements.length > 0) {
      query += " WHERE " + filterStatements.join(" AND ");
    }
    query += " ORDER BY title";
    const jobsRes = await db.query(query, filterValues);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company: {...company_info} }
   *   where company_info is { companyHandle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT j.id,
                  j.title,
                  j.salary,
                  j.equity,
                  j.company_handle,
                  c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl"
           FROM jobs AS j 
           LEFT JOIN companies AS c ON j.company_handle = c.handle
           WHERE j.id = $1`, [id]);

    const jobRawData = jobRes.rows[0];

    if (!jobRawData) throw new NotFoundError(`No job with id: ${id}`);

    const jobFormattedData = {
        id: jobRawData.id,
        title: jobRawData.title,
        salary: jobRawData.salary,
        equity: jobRawData.equity,
        company: {
            handle: jobRawData.handle,
            name: jobRawData.name,
            description: jobRawData.description,
            numEmployees: jobRawData.numEmployees,
            logoUrl: jobRawData.logoUrl
        }
    };

    return jobFormattedData;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}


module.exports = Job;
