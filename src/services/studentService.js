const Student = require("../models/student");
const {
  getOutputFromStudent,
} = require("../utils/student/getOutputFromStudent/getOutputFromStudent");
const redisClient = require("../config/cache");

exports.getOutputFromStudentId = async (studentId) => {
  try {
    const student = await Student.findOne({
      studentId: parseInt(studentId, 10),
    });

    if (student) {
      return getOutputFromStudent(student);
    } else {
      return "Student not Found";
    }
  } catch (error) {
    console.error("Error fetching students by student id:", error);
  }
};

module.exports.getStudentsByName = async (inputName) => {
  try {
    const normalizedName = inputName.trim().toLowerCase();
    const cacheKey = `students:name:${normalizedName}`;

    // 1. Check Redis cache
    const cachedStudents = await redisClient.get(cacheKey);

    if (cachedStudents) {
      console.log("Returning from Redis cache");
      return JSON.parse(cachedStudents);
    }

    // 2. If not in cache, fetch from MongoDB
    console.log("Fetching from MongoDB");

    const students = await Student.find({
      name: { $regex: new RegExp(inputName, "i") },
    });

    // 3. Save result to Redis cache
    await redisClient.setEx(
      cacheKey,
      300, // cache expiry in seconds: 5 minutes
      JSON.stringify(students)
    );

    // 4. Return result
    return students;
  } catch (error) {
    console.error("Error fetching students by name:", error);
    throw error;
  }
};
