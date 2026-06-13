package com.indiza.scholar.model

import com.squareup.moshi.Json

data class FraisExigibleEntity(
    val idFraisExigible: Long = 0,
    val fraisFr: String,
    val fraisEn: String,
    val description: String? = null
)

data class FraisPeriscolaireEntity(
    val idFraisActivitePeriscolaire: Long = 0,
    val libelleFr: String,
    val libelleEn: String? = null,
    val description: String? = null
)

data class TarifFraisPeriscolaireEntity(
    val idTarifFraisActivitePeriscolaire: Long = 0,
    val montantFraisActivitePeriscolaire: Int,
    val idAnneeScolaire: Long,
    val idFraisActivitePeriscolaire: Long,
    @Json(name = "FraisActivitePeriscolaire") val detailsFrais: FraisPeriscolaireEntity? = null
)

data class TarifFraisEntity(
    val idTarifFraisExigible: Long,
    val montantFraisExigible: Int,
    val ordrePaiement: Int,
    val dateLimite: String,
    val dateAlerte: String,
    val idClasse: Long,
    val idAnneeScolaire: Long,
    val idFraisExigible: Long, // Ajouté
    @Json(name = "Frais") val detailsFrais: FraisExigibleEntity? = null
)

data class SaveTarifsPayload(
    val idClasse: Long,
    val idAnneeScolaire: Long,
    val tarifs: List<TarifItemPayload>
)

data class TarifItemPayload(
    val idFrais: Long,
    val montant: Int,
    val ordre: Int,
    val dateLimite: String,
    val dateAlerte: String
)

data class RecouvrementStatsResponse(
    val nbEleves: Int,
    val stats: List<FraisStatItem>
)

data class FraisStatItem(
    val idTarif: Long,
    val libelle: String,
    val montantUnitaire: Int,
    val attendu: Int,
    val encaisse: Int,
    val pourcentage: Float
)

data class PaiementPayload(
    val idEleve: Long,
    val idAnneeScolaire: Long,
    val idClasse: Long,
    val montantVerse: Int,
    val modePaiement: String = "CASH",
    val reference: String? = null
)

data class StudentPaymentDetails(
    val nomComplet: String,
    val classeLabel: String,
    val totalDejaVerse: Int,
    val totalTotalDu: Int,
    val resteGlobal: Int,
    val frais: List<FeePaymentDetail>
)

data class FeePaymentDetail(
    val idTarif: Long,
    val libelle: String,
    val montantDu: Int,
    val montantPaye: Int,
    val reste: Int,
    val isComplet: Boolean
)

data class ClassMissingFrais(
    val idClasse: Long,
    val libelleClasse: String,
    val currentFrais: List<SimpleFraisItem>
)

data class SimpleFraisItem(
    val id: Long,
    val label: String,
    val ordre: Int
)

data class BulkApplyPayload(
    val idFrais: Long,
    val idAnneeScolaire: Long,
    val montant: Int,
    val dateLimite: String,
    val dateAlerte: String,
    val applications: List<ClasseApplication>
)

data class ClasseApplication(
    val idClasse: Long,
    val newOrder: Int
)

data class ReceiptData(
    val schoolInfo: SchoolInfo,
    val receiptInfo: ReceiptInfo,
    val studentInfo: StudentReceiptInfo,
    val financialDetail: FinancialReceiptDetail,
    val validation: ReceiptValidation
)

data class SchoolInfo(
    val name: String,
    val ministry: String?,
    val address: String?,
    val bp: String?,
    val phones: String?,
    val email: String?,
    val authorizationNo: String?,
    val logoUrl: String?
)

data class ReceiptInfo(
    val title: String,
    val receiptNo: String,
    val schoolYear: String,
    val dateTime: String
)

data class StudentReceiptInfo(
    val matricule: String,
    val fullName: String,
    val classLabel: String,
    val cycleLabel: String?
)

data class FinancialReceiptDetail(
    val nature: String,
    val amountDigits: Int,
    val amountWords: String,
    val paymentMode: String,
    val balance: Int,
    val remaining: Int
)

data class ReceiptValidation(
    val cashierName: String,
    val qrContent: String
)

data class BilanResponse(
    val date: String? = null,
    val period: String? = null,
    val chartData: List<ChartDataItem>,
    val transactions: List<PaiementFraisGlobalEntity>? = null
)

data class ChartDataItem(
    val label: String,
    val value: Double
)

data class PerformanceRpItem(
    val idSalle: Long,
    val nomSalle: String,
    val cycle: String,
    val totalAttendu: Double,
    val totalEncaisse: Double,
    val rp: Double
)

data class InsolvableItem(
    val matricule: String?,
    val nomComplet: String,
    val classeSalle: String,
    val montantExigible: Int,
    val montantVerse: Int,
    val dette: Int,
    val tauxDefaillance: Double
)

data class PaiementFraisGlobalEntity(
    val idPaiementFraisGlobal: Long,
    val montantTotal: Int,
    val modePaiement: String,
    val referenceTransaction: String?,
    val idEleve: Long,
    val createdAt: String,
    val Eleve: SimpleEleve? = null
)

data class SimpleEleve(
    val nom: String,
    val prenom: String?,
    val matricule: String?
)
