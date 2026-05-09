import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import "./Login.css";
import { useState, useEffect, useCallback } from "react";

import {
  getFirestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import app from "./firebase";

const auth = getAuth(app);
const db = getFirestore(app);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const signup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => toast.success("Signup Success"))
      .catch((err) => toast.error(err.message));
  };

  const login = () => {
    setLoading(true);

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        toast.success("Login Success");
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        toast.info("Logged Out");
        setSubjects([]);
      })
      .catch((err) => toast.error(err.message));
  };

  const addSubject = () => {
    if (!auth.currentUser) {
      toast.error("Please login first");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter subject");
      return;
    }

    addDoc(collection(db, "subjects"), {
      name: subject,
      completed: false,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    })
      .then(() => {
        setSubject("");
        toast.success("Subject Added");
      })
      .catch((err) => toast.error(err.message));
  };

  const getSubjects = useCallback(() => {
    if (!auth.currentUser) return null;

    const q = query(
      collection(db, "subjects"),
      where("userId", "==", auth.currentUser.uid)
    );

    return onSnapshot(q, (querySnapshot) => {
      let list = [];

      querySnapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      setSubjects(list);
    });
  }, []);

  const deleteSubject = async (id) => {
    await deleteDoc(doc(db, "subjects", id));
    toast.info("Subject Deleted");
  };

  const toggleComplete = async (item) => {
    const ref = doc(db, "subjects", item.id);

    await updateDoc(ref, {
      completed: !item.completed
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;

      if (!result) return;

      const data = new Uint8Array(result);

      const workbook = XLSX.read(data, {
        type: "array"
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const dataFromExcel = XLSX.utils.sheet_to_json(worksheet);

      setExcelData(dataFromExcel);
      toast.success("Excel Uploaded");
    };

    reader.readAsArrayBuffer(file);
  };

  const exportExcel = () => {
    if (excelData.length === 0) {
      toast.error("Please upload Excel first");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Marks");
    XLSX.writeFile(workbook, "Marks_Report.xlsx");
  };

  const exportPDF = () => {
    if (excelData.length === 0) {
      toast.error("Please upload Excel first");
      return;
    }

    const doc = new jsPDF();

    doc.text("Marks Report", 20, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Subject", "Marks"]],
      body: excelData.map((item) => [item.Subject, item.Marks])
    });

    doc.save("Marks_Report.pdf");
  };

  const completedCount = subjects.filter((item) => item.completed).length;

  const progress =
    subjects.length > 0
      ? Math.round((completedCount / subjects.length) * 100)
      : 0;

  const totalSubjects = subjects.length;
  const completedSubjects = subjects.filter((item) => item.completed).length;
  const pendingSubjects = totalSubjects - completedSubjects;

  const totalMarks = excelData.reduce(
    (sum, item) => sum + Number(item.Marks || 0),
    0
  );

  const averageMarks =
    excelData.length > 0 ? (totalMarks / excelData.length).toFixed(2) : 0;

  let grade = "F";

  if (Number(averageMarks) >= 90) {
    grade = "A+";
  } else if (Number(averageMarks) >= 75) {
    grade = "A";
  } else if (Number(averageMarks) >= 60) {
    grade = "B";
  } else if (Number(averageMarks) >= 40) {
    grade = "C";
  }

  const filteredSubjects = subjects.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = {
    labels: excelData.map((item) => item.Subject),
    datasets: [
      {
        label: "Marks",
        data: excelData.map((item) => item.Marks),
        backgroundColor: "#2563eb"
      }
    ]
  };

  const pieData = {
    labels: ["Completed", "Pending"],
    datasets: [
      {
        data: [completedSubjects, pendingSubjects],
        backgroundColor: ["#22c55e", "#ef4444"]
      }
    ]
  };

  const remainingDays = examDate
    ? Math.ceil(
        (new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : null;

  useEffect(() => {
    let unsubscribeSubjects = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribeSubjects = getSubjects();
      } else {
        setSubjects([]);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeSubjects) {
        unsubscribeSubjects();
      }
    };
  }, [getSubjects]);

  return (
    <>
      <button
        className="menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <div className="main-layout">
        <div
          className={
            sidebarOpen ? "sidebar active-sidebar" : "sidebar"
          }
        >
          <h2 className="logo">📚 Tracker</h2>

          <ul className="sidebar-menu">
            <li
              className={activePage === "dashboard" ? "active-menu" : ""}
              onClick={() => setActivePage("dashboard")}
            >
              🏠 Dashboard
            </li>

            <li
              className={activePage === "subjects" ? "active-menu" : ""}
              onClick={() => setActivePage("subjects")}
            >
              📘 Subjects
            </li>

            <li
              className={activePage === "analytics" ? "active-menu" : ""}
              onClick={() => setActivePage("analytics")}
            >
              📊 Analytics
            </li>

            <li onClick={() => setDarkMode(!darkMode)}>
              🌙 Theme
            </li>
          </ul>
        </div>

        <div
          className="app-container"
          style={{
            backgroundColor: darkMode ? "#111827" : "#f3f4f6",
            color: darkMode ? "white" : "black",
            minHeight: "100vh",
            transition: "0.3s"
          }}
        >
          <div
            className="card"
            style={{
              backgroundColor: darkMode ? "#1f2937" : "white",
              color: darkMode ? "white" : "black",
              transition: "0.3s"
            }}
          >
            {activePage === "dashboard" && (
              <>
                <h2>Syllabus Tracker</h2>

                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <h3>Total</h3>
                    <p>{totalSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Completed</h3>
                    <p>{completedSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Pending</h3>
                    <p>{pendingSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Average</h3>
                    <p>{averageMarks}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Grade</h3>
                    <p>{grade}</p>
                  </div>
                </div>

                <h3>Progress: {progress}% Completed</h3>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`
                    }}
                  ></div>
                </div>

                <input
                  className="input"
                  type="email"
                  placeholder="Enter Email"
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  className="input"
                  type="password"
                  placeholder="Enter Password"
                  onChange={(e) => setPassword(e.target.value)}
                />

                <input
                  className="input"
                  type="text"
                  placeholder="Enter Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                {loading && (
                  <h3 style={{ color: "#2563eb" }}>
                    Loading...
                  </h3>
                )}

                <div>
                  <button className="button signup" onClick={signup}>
                    Signup
                  </button>

                  <button className="button login" onClick={login}>
                    Login
                  </button>

                  <button className="button add" onClick={addSubject}>
                    Add Subject
                  </button>

                  <button className="button logout" onClick={logout}>
                    Logout
                  </button>

                  <button
                    className="button"
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>

                  <button className="button" onClick={exportExcel}>
                    Export Excel
                  </button>

                  <button className="button" onClick={exportPDF}>
                    Export PDF
                  </button>
                </div>

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="input"
                />

                <input
                  className="input"
                  type="text"
                  placeholder="Search Subject"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <input
                  type="date"
                  className="input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />

                {remainingDays !== null && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "15px",
                      borderRadius: "10px",
                      background: "#2563eb",
                      color: "white",
                      textAlign: "center"
                    }}
                  >
                    <h3>⏳ {remainingDays} Days Left</h3>
                  </div>
                )}

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    marginTop: "20px"
                  }}
                >
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((item) => (
                      <li className="subject-item" key={item.id}>
                        <div className="subject-left">
                          <input
                            type="checkbox"
                            checked={item.completed || false}
                            onChange={() => toggleComplete(item)}
                          />

                          <span
                            style={{
                              textDecoration: item.completed
                                ? "line-through"
                                : "none"
                            }}
                          >
                            {item.name}
                          </span>
                        </div>

                        <button
                          className="button delete"
                          onClick={() => deleteSubject(item.id)}
                        >
                          Delete
                        </button>
                      </li>
                    ))
                  ) : (
                    <p style={{ textAlign: "center", opacity: 0.7 }}>
                      No Subjects Found 📚
                    </p>
                  )}
                </ul>

                {excelData.length > 0 && (
                  <>
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "15px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "10px",
                        color: "black"
                      }}
                    >
                      <h3>Marks Analytics</h3>
                      <p>
                        <strong>Total Subjects:</strong> {excelData.length}
                      </p>
                      <p>
                        <strong>Average Marks:</strong> {averageMarks}
                      </p>
                      <p>
                        <strong>Grade:</strong> {grade}
                      </p>
                    </div>

                    <table
                      style={{
                        width: "100%",
                        marginTop: "20px",
                        borderCollapse: "collapse"
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: "#2563eb",
                            color: "white"
                          }}
                        >
                          <th style={{ padding: "10px" }}>Subject</th>
                          <th style={{ padding: "10px" }}>Marks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {excelData.map((item, index) => (
                          <tr key={index}>
                            <td
                              style={{
                                padding: "10px",
                                border: "1px solid #ccc"
                              }}
                            >
                              {item.Subject}
                            </td>

                            <td
                              style={{
                                padding: "10px",
                                border: "1px solid #ccc"
                              }}
                            >
                              {item.Marks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ marginTop: "30px" }}>
                      <h3>Marks Chart</h3>
                      <Bar data={chartData} />
                    </div>
                  </>
                )}
              </>
            )}

            {activePage === "subjects" && (
              <div>
                <h2>📘 Subjects</h2>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0
                  }}
                >
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((item) => (
                      <li key={item.id} className="subject-item">
                        {item.name}
                      </li>
                    ))
                  ) : (
                    <p>No Subjects Found 📚</p>
                  )}
                </ul>
              </div>
            )}

            {activePage === "analytics" && (
              <div>
                <h2>📊 Analytics</h2>

                {excelData.length > 0 ? (
                  <>
                    <Bar data={chartData} />

                    <div style={{ marginTop: "30px" }}>
                      <Pie data={pieData} />
                    </div>
                  </>
                ) : (
                  <p>No Excel Data Uploaded</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" />
    </>
  );
}

export default Login;