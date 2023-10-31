"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  testJobId
} = require("./_testCommon");
const { UnauthorizedError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 6,
    equity: "0.7",
    companyHandle: "c1",
  };

  test("Unauthorized attempt: Not Admin", async function () {
    try{
      await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        ...newJob,
        id: expect.any(Number)
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 1000000,
          equity: "0.99"
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: 500,
            equity: "10",
            companyHandle: "c1",
          })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            { 
                id: testJobId[0],
                title: "j1", 
                salary: 1, 
                equity: "0.1", 
                companyHandle: "c1",
                companyName: "C1"
            },
            { 
                id: testJobId[0] + 1,
                title: "j2", 
                salary: 2, 
                equity: "0.2", 
                companyHandle: "c1",
                companyName: "C1"
            },
            { 
                id: testJobId[0] + 2,
                title: "j3", 
                salary: 3, 
                equity: "0",
                companyHandle: "c2",
                companyName: "C2"
            }
          ],
    });
  });
  test("Filtering works for 1 filter", async function () {
    const resp = await request(app)
    .get("/jobs")
    .query({ minSalary: 2 });
    expect(resp.body).toEqual({
      jobs:
          [
            { 
                id: testJobId[0] + 1,
                title: "j2", 
                salary: 2, 
                equity: "0.2", 
                companyHandle: "c1",
                companyName: "C1"
            },
            { 
                id: testJobId[0] + 2,
                title: "j3", 
                salary: 3, 
                equity: "0",
                companyHandle: "c2",
                companyName: "C2"
            }
          ]
    });
  });
    test("Filtering works for all filter", async function () {
      const resp = await request(app)
      .get("/jobs")
      .query({  minSalary: 1, hasEquity: true, title: "1" });
      expect(resp.body).toEqual({
        jobs:
            [
                { 
                    id: testJobId[0],
                    title: "j1", 
                    salary: 1, 
                    equity: "0.1", 
                    companyHandle: "c1",
                    companyName: "C1"
                },
            ]
      });
  });
  test("Ignores bad input", async function () {
    const resp = await request(app)
    .get("/jobs")
    .query({ minSalary: "NaN", hasEquity: true });
    expect(resp.body).toEqual({
      jobs:
          [
            { 
                id: testJobId[0],
                title: "j1", 
                salary: 1, 
                equity: "0.1", 
                companyHandle: "c1",
                companyName: "C1"
            },
            { 
                id: testJobId[0] + 1,
                title: "j2", 
                salary: 2, 
                equity: "0.2", 
                companyHandle: "c1",
                companyName: "C1"
            },
          ]
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobId[0]}/`);
    expect(resp.body).toEqual({
      job: { 
        id: testJobId[0],
        title: "j1", 
        salary: 1, 
        equity: "0.1", 
        company: {
          handle: "c1",
          name: "C1",
          numEmployees: 1,
          description: "Desc1",
          logoUrl: "http://c1.img",
        } 
    },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/companies/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobId[0]}`)
        .send({
          salary: 5,
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobId[0],
        title: "j1", 
        salary: 5, 
        equity: "0.1", 
        companyHandle: "c1" 
      },
    });
  });

  test("does not works for non-admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobId[0]}`)
        .send({
          salary: 5,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobId[0]}`)
        .send({
          salary: 5,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          salary: 5,
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobId[0]}`)
        .send({
          companyHandle: "c3-p0",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobId[0]}`)
        .send({
          equity: "10",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("does not works for non-admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobId[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("works for admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobId[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: `${testJobId[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobId[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
