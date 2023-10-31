"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobId
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 50000,
    equity: "0",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
        ...newJob,
        id: expect.any(Number)
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("finds all jobs", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1000,
        equity: "0",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2000,
        equity: "0.01",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3000,
        equity: "0.1",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: expect.any(Number),
        title: "j4",
        salary: null,
        equity: null,
        companyHandle: "c2",
        companyName: "C2",
      },
    ]);
  });
  
  test("filters by min salary", async function () {
    let jobs = await Job.findAll({ minSalary: 1200 });
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "j2",
            salary: 2000,
            equity: "0.01",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: expect.any(Number),
            title: "j3",
            salary: 3000,
            equity: "0.1",
            companyHandle: "c1",
            companyName: "C1",
          },
    ]);
  });

  test("filters by equity", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "j2",
            salary: 2000,
            equity: "0.01",
            companyHandle: "c1",
            companyName: "C1"
        },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 3000,
            equity: "0.1",
            companyHandle: "c1",
            companyName: "C1"
        }
    ]);
  });

  test("filters by both min salary and equity", async function () {
    let jobs = await Job.findAll({ minSalary: 500, hasEquity: true });
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "j2",
            salary: 2000,
            equity: "0.01",
            companyHandle: "c1",
            companyName: "C1"
        },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 3000,
            equity: "0.1",
            companyHandle: "c1",
            companyName: "C1"
        }
    ]);
  });

  test("Filters by name", async function () {
    let jobs = await Job.findAll({ title: "4" });
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "j4",
            salary: null,
            equity: null,
            companyHandle: "c2",
            companyName: "C2"
        }
    ]);
  });
  

  test("Returns empty list when nothing found", async function () {
    let jobs = await Job.findAll({ title: "DoesNotExist" });
    expect(jobs).toEqual([]);
  });
});

/************************************** get */

describe("get job", function () {
  test("works", async function () {
    let job = await Job.get(jobId[0]);
    expect(job).toEqual({
        id: jobId[0],
        title: "j1",
        salary: 1000,
        equity: "0",
        company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          }
      });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 5000,
    equity: "0.5",
  };

  test("works", async function () {
    let job = await Job.update(jobId[0], updateData);
    expect(job).toEqual({
      id: jobId[0],
      companyHandle: "c1",
      ...updateData,
    });
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null
    };

    let job = await Job.update(jobId[0], updateDataSetNulls);
    expect(job).toEqual({
        id: jobId[0],
        companyHandle: "c1",
      ...updateDataSetNulls,
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(jobId[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobId[0]);
    const res = await db.query(
        "SELECT * FROM jobs WHERE id=$1", [jobId[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
