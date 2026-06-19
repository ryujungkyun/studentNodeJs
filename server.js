const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(function (request, response, next) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.use(function (error, request, response, next) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    response.status(400).json({
      message: "JSON 형식이 올바르지 않습니다.",
    });
    return;
  }

  next(error);
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

function isIntegerId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function readStudentBody(body) {
  const source = body || {};
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const score = source.score;

  if (
    name.length < 1 ||
    name.length > 50 ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100
  ) {
    return null;
  }

  return {
    name: name,
    score: score,
  };
}

async function findStudentById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, score FROM students WHERE id = ?",
    [id]
  );

  return rows[0];
}

function sendTodo(response, apiName) {
  response.status(501).json({
    message: `${apiName} API를 구현해야 합니다.`,
  });
}

app.get("/health", function (request, response) {
  response.json({
    status: "ok",
  });
});

app.get("/students/search", async function (request, response, next) {
  try {

    const minScore = isIntegerId(request.query.minScore);
    const maxScore = isIntegerId(request.query.maxScore);

    if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) {
      response.status(400).json({
        message: "minScore와 maxScore는 숫자여야 합니다.",
      });
      return;
    }

    if (minScore > maxScore) {
      response.status(400).json({
        message: "minScore는 maxScore보다 클 수 없습니다.",
      });
      return;
    }

    const [rows] = await pool.query(
      "SELECT id, name, score FROM students WHERE score BETWEEN ? AND ? ORDER BY id ASC",
      [minScore, maxScore]
    );

    response.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get("/students", async function (request, response, next) {
  try {
    // TODO:
    // 1. students table에서 id, name, score를 조회합니다.
    // 2. id 오름차순으로 정렬합니다.
    // 3. rows를 response.json(rows)로 응답합니다.

    const [rows] = await pool.query(
      "SELECT id, name, score FROM students ORDER BY id ASC"
    );

    response.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/students", async function (request, response, next) {
  try {
    // TODO:
    // 1. readStudentBody(request.body)로 body를 검사합니다.
    const student = readStudentBody(request.body);
    // 2. 올바르지 않으면 400으로 응답합니다.
    if(student === null) {
      response.status(400).json({
        message: "학생 정보가 올바르지 않습니다.",
      });
      return;
    }
    // 3. INSERT로 학생을 추가합니다.
    const [result] = await pool.query(
      "INSERT INTO students (name, score) VALUES (?, ?)",
      [student.name, student.score]
    );
    // 4. result.insertId로 새 학생 id를 확인합니다.
    const newStudentId = result.insertId;
    // 5. findStudentById(id)로 새 학생을 다시 조회합니다.
    const newStudent = await findStudentById(newStudentId);
    // 6. status 201과 함께 새 학생 객체를 응답합니다.
    response.status(201).json(newStudent);
  } catch (error) {
    next(error);
  }
});

app.get("/students/:id", async function (request, response, next) {
  try {
    // TODO:
    // 1. request.params.id를 정수로 바꿉니다.
    // 2. 정수가 아니면 400으로 응답합니다.
    // 3. findStudentById(id)로 학생을 조회합니다.
    // 4. 학생이 없으면 404로 응답합니다.
    // 5. 학생 객체를 응답합니다.
    sendTodo(response, "GET /students/:id");
  } catch (error) {
    next(error);
  }
});

app.patch("/students/:id", async function (request, response, next) {
  try {
    // TODO:
    // 1. id를 검사합니다.
    // 2. 수정할 학생이 있는지 조회합니다.
    // 3. readStudentBody(request.body)로 body를 검사합니다.
    // 4. UPDATE로 name, score를 수정합니다.
    // 5. 수정된 학생을 다시 조회해서 응답합니다.
    sendTodo(response, "PATCH /students/:id");
  } catch (error) {
    next(error);
  }
});

app.delete("/students/:id", async function (request, response, next) {
  try {
    // TODO:
    // 1. id를 검사합니다.
    // 2. 삭제할 학생이 있는지 먼저 조회합니다.
    // 3. 학생이 없으면 404로 응답합니다.
    // 4. DELETE로 삭제합니다.
    // 5. 삭제 메시지와 삭제된 학생 객체를 응답합니다.
    sendTodo(response, "DELETE /students/:id");
  } catch (error) {
    next(error);
  }
});

app.use(function (request, response) {
  response.status(404).json({
    message: "요청한 API를 찾을 수 없습니다.",
  });
});

app.use(function (error, request, response, next) {
  console.error(error);
  response.status(500).json({
    message: "서버 오류가 발생했습니다.",
  });
});

app.listen(port, function () {
  console.log(`API 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});