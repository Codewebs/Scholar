package com.indiza.scholar.utils

object ValidationUtils {
    
    fun validateArrete(arrete: String, pays: String): Boolean {
        val regex = when (pays.uppercase()) {
            "GABON" -> Regex("^(?i)arr[eéè]t[eé]\\s+n°\\s*\\d+(\\/\\d+)?\\/[A-Z-]+$")
            "COTE D'IVOIRE", "CÔTE D'IVOIRE" -> Regex("^(?i)arr[eéè]t[eé]\\s+n°\\s*\\d+\\s*\\/?[A-Z.]+\\/CAB$")
            "CAMEROUN" -> Regex("^(?i)arr[eéè]t[eé]\\s+n°\\s*[\\d/]+\\/[A-Z]+(\\/[A-Z]+)*$")
            "TCHAD" -> Regex("^(?i)arr[eéè]t[eé]\\s+n°\\s*\\d+\\s*/P[RT]/PM/[A-Z]+(/.*)?/\\d{4}$")
            "RCA" -> Regex("^(?i)arr[eéè]t[eé]\\s+n°\\s*\\d+\\s*/[A-Z]+/(CAB|DIRCAB)(/[A-Z0-9.]+)*$")
            else -> return true // Default to true if country not specifically matched
        }
        return regex.matches(arrete)
    }
}
