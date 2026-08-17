import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS dev_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT NULL,
      project VARCHAR(120) NULL,
      assignee_id INT NULL,
      priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
      status ENUM('Backlog','In Progress','Code Review','Testing','Done') DEFAULT 'Backlog',
      review_status ENUM('Not Submitted','Pending Review','Changes Requested','Approved') DEFAULT 'Not Submitted',
      due_date DATE NULL,
      created_by VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS dev_bugs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT NULL,
      project VARCHAR(120) NULL,
      severity ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
      status ENUM('Open','In Progress','Fixed','Verified','Closed','Reopened') DEFAULT 'Open',
      reported_by_id INT NULL,
      reported_by VARCHAR(120) NULL,
      assignee_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS dev_timesheets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      work_date DATE NOT NULL,
      project VARCHAR(120) NULL,
      task_id INT NULL,
      hours DECIMAL(4,1) NOT NULL,
      summary VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS dev_deployments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project VARCHAR(120) NOT NULL,
      version_tag VARCHAR(60) NULL,
      environment ENUM('Development','Staging','Production') DEFAULT 'Production',
      features TEXT NULL,
      status ENUM('Success','Failed','Rolled Back') DEFAULT 'Success',
      deployed_by_id INT NULL,
      deployed_by VARCHAR(120) NULL,
      deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS dev_milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project VARCHAR(120) NOT NULL,
      title VARCHAR(200) NOT NULL,
      target_date DATE NULL,
      progress INT DEFAULT 0,
      status ENUM('Planned','On Track','At Risk','Delayed','Completed') DEFAULT 'Planned',
      notes VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
ensureTables().catch((e) => console.error("itdev schema error:", e.message));

const isAdmin = (req) => req.user.role === "SUPER_ADMIN";

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */
export const listTasks = async (req, res) => {
  try {
    let sql = `SELECT t.*, e.name AS assignee FROM dev_tasks t
               LEFT JOIN employees e ON e.id = t.assignee_id`;
    const params = [];
    if (!isAdmin(req)) {
      sql += " WHERE t.assignee_id = ?";
      params.push(req.user.id);
    }
    sql += " ORDER BY FIELD(t.status,'In Progress','Code Review','Testing','Backlog','Done'), t.due_date IS NULL, t.due_date";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignee_id, priority, due_date } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "title required" });
    const [r] = await db.query(
      `INSERT INTO dev_tasks (title, description, project, assignee_id, priority, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, project || null, assignee_id || null,
       priority || "Medium", due_date || null, req.user.name || "Admin"]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const allowed = ["title", "description", "project", "assignee_id", "priority", "status", "review_status", "due_date"];
    const fields = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        fields.push(`${k} = ?`);
        params.push(req.body[k] === "" ? null : req.body[k]);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: "Nothing to update" });

    // Non-admin can only update status/review_status of their own tasks
    if (!isAdmin(req)) {
      const [[task]] = await db.query("SELECT assignee_id FROM dev_tasks WHERE id = ?", [req.params.id]);
      if (!task || task.assignee_id !== req.user.id)
        return res.status(403).json({ success: false, message: "Not your task" });
    }

    params.push(req.params.id);
    await db.query(`UPDATE dev_tasks SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await db.query("DELETE FROM dev_tasks WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Bugs                                                                */
/* ------------------------------------------------------------------ */
export const listBugs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, e.name AS assignee FROM dev_bugs b
       LEFT JOIN employees e ON e.id = b.assignee_id
       ORDER BY FIELD(b.severity,'Critical','High','Medium','Low'),
                FIELD(b.status,'Open','Reopened','In Progress','Fixed','Verified','Closed')`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createBug = async (req, res) => {
  try {
    const { title, description, project, severity, assignee_id } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "title required" });
    const [r] = await db.query(
      `INSERT INTO dev_bugs (title, description, project, severity, assignee_id, reported_by_id, reported_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, project || null, severity || "Medium",
       assignee_id || null, req.user.id || null, req.user.name || "Admin"]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateBug = async (req, res) => {
  try {
    const allowed = ["title", "description", "project", "severity", "status", "assignee_id"];
    const fields = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        fields.push(`${k} = ?`);
        params.push(req.body[k] === "" ? null : req.body[k]);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    params.push(req.params.id);
    await db.query(`UPDATE dev_bugs SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteBug = async (req, res) => {
  try {
    await db.query("DELETE FROM dev_bugs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Timesheets                                                          */
/* ------------------------------------------------------------------ */
export const listTimesheets = async (req, res) => {
  try {
    let sql = `SELECT ts.*, e.name AS employee FROM dev_timesheets ts
               LEFT JOIN employees e ON e.id = ts.employee_id`;
    const params = [];
    if (!isAdmin(req)) {
      sql += " WHERE ts.employee_id = ?";
      params.push(req.user.id);
    }
    sql += " ORDER BY ts.work_date DESC, ts.id DESC LIMIT 200";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const logTime = async (req, res) => {
  try {
    const { work_date, project, task_id, hours, summary, employee_id } = req.body;
    const empId = isAdmin(req) && employee_id ? employee_id : req.user.id;
    if (!work_date || !hours)
      return res.status(400).json({ success: false, message: "work_date and hours required" });
    if (Number(hours) <= 0 || Number(hours) > 24)
      return res.status(400).json({ success: false, message: "hours must be between 0 and 24" });

    const [r] = await db.query(
      `INSERT INTO dev_timesheets (employee_id, work_date, project, task_id, hours, summary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [empId, work_date, project || null, task_id || null, Number(hours), summary || null]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteTimesheet = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      const [[row]] = await db.query("SELECT employee_id FROM dev_timesheets WHERE id = ?", [req.params.id]);
      if (!row || row.employee_id !== req.user.id)
        return res.status(403).json({ success: false, message: "Not your entry" });
    }
    await db.query("DELETE FROM dev_timesheets WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Deployments                                                         */
/* ------------------------------------------------------------------ */
export const listDeployments = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM dev_deployments ORDER BY deployed_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const logDeployment = async (req, res) => {
  try {
    const { project, version_tag, environment, features, status } = req.body;
    if (!project) return res.status(400).json({ success: false, message: "project required" });
    const [r] = await db.query(
      `INSERT INTO dev_deployments (project, version_tag, environment, features, status, deployed_by_id, deployed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project, version_tag || null, environment || "Production", features || null,
       status || "Success", req.user.id || null, req.user.name || "Admin"]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteDeployment = async (req, res) => {
  try {
    await db.query("DELETE FROM dev_deployments WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Milestones                                                          */
/* ------------------------------------------------------------------ */
export const listMilestones = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM dev_milestones
       ORDER BY FIELD(status,'At Risk','Delayed','On Track','Planned','Completed'), target_date IS NULL, target_date`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createMilestone = async (req, res) => {
  try {
    const { project, title, target_date, progress, status, notes } = req.body;
    if (!project || !title)
      return res.status(400).json({ success: false, message: "project and title required" });
    const [r] = await db.query(
      `INSERT INTO dev_milestones (project, title, target_date, progress, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [project, title, target_date || null, Math.min(100, Math.max(0, Number(progress) || 0)),
       status || "Planned", notes || null]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateMilestone = async (req, res) => {
  try {
    const allowed = ["project", "title", "target_date", "progress", "status", "notes"];
    const fields = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        fields.push(`${k} = ?`);
        params.push(
          k === "progress"
            ? Math.min(100, Math.max(0, Number(req.body[k]) || 0))
            : req.body[k] === "" ? null : req.body[k]
        );
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    params.push(req.params.id);
    await db.query(`UPDATE dev_milestones SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteMilestone = async (req, res) => {
  try {
    await db.query("DELETE FROM dev_milestones WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Performance summary                                                 */
/* ------------------------------------------------------------------ */
export const performanceSummary = async (req, res) => {
  try {
    const [taskStats] = await db.query(
      `SELECT e.name AS developer,
              COUNT(*) AS total_tasks,
              SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) AS done,
              SUM(CASE WHEN t.review_status = 'Approved' THEN 1 ELSE 0 END) AS approved_reviews
       FROM dev_tasks t
       JOIN employees e ON e.id = t.assignee_id
       GROUP BY e.name ORDER BY done DESC`
    );
    const [bugStats] = await db.query(
      `SELECT e.name AS developer,
              SUM(CASE WHEN b.status IN ('Fixed','Verified','Closed') THEN 1 ELSE 0 END) AS fixed,
              COUNT(*) AS assigned
       FROM dev_bugs b
       JOIN employees e ON e.id = b.assignee_id
       GROUP BY e.name`
    );
    const [hoursByDev] = await db.query(
      `SELECT e.name AS developer, SUM(ts.hours) AS hours
       FROM dev_timesheets ts
       JOIN employees e ON e.id = ts.employee_id
       WHERE ts.work_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY e.name ORDER BY hours DESC`
    );
    const [[counts]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM dev_tasks WHERE status <> 'Done') AS open_tasks,
        (SELECT COUNT(*) FROM dev_bugs WHERE status IN ('Open','Reopened','In Progress')) AS open_bugs,
        (SELECT COUNT(*) FROM dev_tasks WHERE status = 'Code Review') AS in_review,
        (SELECT COUNT(*) FROM dev_deployments WHERE deployed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS deployments_30d`
    );
    res.json({ taskStats, bugStats, hoursByDev, counts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
