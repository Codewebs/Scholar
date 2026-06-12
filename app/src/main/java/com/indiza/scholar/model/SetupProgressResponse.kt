package com.indiza.scholar.model

data class SetupProgressResponse(
    val schoolYear: ProgressItem,
    val academicProfile: ProgressItem,
    val globalFees: ProgressItem,
    val classFees: MultiProgressItem,
    val rooms: MultiProgressItem,
    val periods: ProgressItem,
    val subPeriods: ProgressItem,
    val subjects: MultiProgressItem,
    val teachers: TeacherProgressItem,
    val students: StudentCountItem
)

data class ProgressItem(
    val done: Boolean,
    val count: Int = 0,
    val label: String? = null
)

data class MultiProgressItem(
    val done: Boolean,
    val count: Int,
    val total: Int
)

data class TeacherProgressItem(
    val done: Boolean,
    val assigned: Int,
    val total: Int,
    val sallesAssigned: Int,
    val totalSalles: Int
)

data class StudentCountItem(
    val count: Int
)
