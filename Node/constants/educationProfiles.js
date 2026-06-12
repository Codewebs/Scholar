const EducationProfiles = {
    countries: [
        {
            nomPays: "Cameroun",
            profils: [
                {
                    nomProfil: "Enseignement Général Francophone / Anglophone",
                    enseignementLibelles: { fr: "Enseignement Général", en: "General Education", es: "Educación General" },
                    cycles: [
                        {
                            libelles: { fr: "Maternelle", en: "Nursery", es: "Preescolar" },
                            classes: [
                                { libelles: { fr: "Petite Section", en: "Pre-First", es: "Jardín de Infancia 1" }, abreviation: "PS" },
                                { libelles: { fr: "Moyenne Section", en: "Pre-Second", es: "Jardín de Infancia 2" }, abreviation: "MS" },
                                { libelles: { fr: "Grande Section", en: "Kindergarten", es: "Kinder" }, abreviation: "GS" }
                            ]
                        },
                        {
                            libelles: { fr: "Primaire", en: "Primary", es: "Primaria" },
                            classes: [
                                { libelles: { fr: "SIL", en: "Class 1", es: "Primero de Primaria" }, abreviation: "SIL" },
                                { libelles: { fr: "CP", en: "Class 2", es: "Segundo de Primaria" }, abreviation: "CP" },
                                { libelles: { fr: "CE1", en: "Class 3", es: "Tercero de Primaria" }, abreviation: "CE1" },
                                { libelles: { fr: "CE2", en: "Class 4", es: "Cuarto de Primaria" }, abreviation: "CE2" },
                                { libelles: { fr: "CM1", en: "Class 5", es: "Quinto de Primaria" }, abreviation: "CM1" },
                                { libelles: { fr: "CM2", en: "Class 6", es: "Sexto de Primaria" }, abreviation: "CM2" }
                            ]
                        },
                        {
                            libelles: { fr: "Secondaire Général (1er Cycle)", en: "Secondary General (1st Cycle)", es: "Secundaria (Primer Ciclo)" },
                            classes: [
                                { libelles: { fr: "6ème", en: "Form 1", es: "1º de ESO" }, abreviation: "6e" },
                                { libelles: { fr: "5ème", en: "Form 2", es: "2º de ESO" }, abreviation: "5e" },
                                { libelles: { fr: "4ème", en: "Form 3", es: "3º de ESO" }, abreviation: "4e" },
                                { libelles: { fr: "3ème", en: "Form 4", es: "4º de ESO" }, abreviation: "3e" }
                            ]
                        },
                        {
                            libelles: { fr: "Secondaire Général (2nd Cycle)", en: "Secondary General (2nd Cycle)", es: "Bachillerato" },
                            classes: [
                                { libelles: { fr: "Seconde", en: "Form 5", es: "1º de Bachillerato" }, abreviation: "2nde" },
                                { libelles: { fr: "Première", en: "Lower Sixth", es: "2º de Bachillerato" }, abreviation: "1ère" },
                                { libelles: { fr: "Terminale", en: "Upper Sixth", es: "3º de Bachillerato" }, abreviation: "Tle" }
                            ]
                        }
                    ]
                },
                {
                    nomProfil: "Enseignement Technique",
                    enseignementLibelles: { fr: "Enseignement Technique", en: "Technical Education", es: "Educación Técnica" },
                    cycles: [
                        {
                            libelles: { fr: "Secondaire Technique (1er Cycle)", en: "Technical Secondary (1st Cycle)", es: "Secundaria Técnica (1er Ciclo)" },
                            classes: [
                                { libelles: { fr: "1ère Année", en: "Year 1", es: "1º Año Técnica" }, abreviation: "1A" },
                                { libelles: { fr: "2ème Année", en: "Year 2", es: "2º Año Técnica" }, abreviation: "2A" },
                                { libelles: { fr: "3ème Année", en: "Year 3", es: "3º Año Técnica" }, abreviation: "3A" },
                                { libelles: { fr: "4ème Année", en: "Year 4", es: "4º Año Técnica" }, abreviation: "4A" }
                            ]
                        },
                        {
                            libelles: { fr: "Secondaire Technique (2nd Cycle)", en: "Technical Secondary (2nd Cycle)", es: "Bachillerato Técnico" },
                            classes: [
                                { libelles: { fr: "Seconde STT", en: "Form 5 STT", es: "1º Bachillerato Técnico" }, abreviation: "SEC STT" },
                                { libelles: { fr: "Première STT", en: "Lower Sixth STT", es: "2º Bachillerato Técnico" }, abreviation: "1ER STT" },
                                { libelles: { fr: "Terminale STT", en: "Upper Sixth STT", es: "3º Bachillerato Técnico" }, abreviation: "TLE STT" }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            nomPays: "Gabon",
            profils: [
                {
                    nomProfil: "Enseignement Général (Système Gabonais)",
                    enseignementLibelles: { fr: "Enseignement Général", en: "General Education", es: "Educación General" },
                    cycles: [
                        {
                            libelles: { fr: "Pré-primaire", en: "Pre-primary", es: "Educación Preescolar" },
                            classes: [
                                { libelles: { fr: "Petite Section", en: "Nursery 1", es: "Párvulos 1" }, abreviation: "PS" },
                                { libelles: { fr: "Moyenne Section", en: "Nursery 2", es: "Párvulos 2" }, abreviation: "MS" },
                                { libelles: { fr: "Grande Section", en: "Nursery 3", es: "Párvulos 3" }, abreviation: "GS" }
                            ]
                        },
                        {
                            libelles: { fr: "Primaire", en: "Primary", es: "Primaria" },
                            classes: [
                                { libelles: { fr: "Année 1 (CP)", en: "Grade 1 (CP)", es: "1º de Primaria" }, abreviation: "CP" },
                                { libelles: { fr: "Année 2 (CE1)", en: "Grade 2 (CE1)", es: "2º de Primaria" }, abreviation: "CE1" },
                                { libelles: { fr: "Année 3 (CE2)", en: "Grade 3 (CE2)", es: "3º de Primaria" }, abreviation: "CE2" },
                                { libelles: { fr: "Année 4 (CM1)", en: "Grade 4 (CM1)", es: "4º de Primaria" }, abreviation: "CM1" },
                                { libelles: { fr: "Année 5 (CM2)", en: "Grade 5 (CM2)", es: "5º de Primaria" }, abreviation: "CM2" }
                            ]
                        },
                        {
                            libelles: { fr: "Secondaire (Premier Cycle)", en: "Lower Secondary", es: "Secundaria de Primer Ciclo" },
                            classes: [
                                { libelles: { fr: "6ème", en: "Grade 6", es: "6º de Grado" }, abreviation: "6e" },
                                { libelles: { fr: "5ème", en: "Grade 7", es: "7º de Grado" }, abreviation: "5e" },
                                { libelles: { fr: "4ème", en: "Grade 8", es: "8º de Grado" }, abreviation: "4e" },
                                { libelles: { fr: "3ème", en: "Grade 9", es: "9º de Grado" }, abreviation: "3e" }
                            ]
                        },
                        {
                            libelles: { fr: "Secondaire (Second Cycle)", en: "Upper Secondary", es: "Secundaria de Segundo Ciclo" },
                            classes: [
                                { libelles: { fr: "Seconde", en: "Grade 10", es: "10º de Grado" }, abreviation: "2nde" },
                                { libelles: { fr: "Première", en: "Grade 11", es: "11º de Grado" }, abreviation: "1ère" },
                                { libelles: { fr: "Terminale", en: "Grade 12", es: "12º de Grado" }, abreviation: "Tle" }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            nomPays: "Guinée Équatoriale",
            profils: [
                {
                    nomProfil: "Sistema Educativo Nacional (Español / Francés)",
                    enseignementLibelles: { es: "Educación General", fr: "Enseignement Général", en: "General Education" },
                    cycles: [
                        {
                            libelles: { es: "Educación Preescolar", fr: "Enseignement Pré-primaire", en: "Pre-school Education" },
                            classes: [
                                { libelles: { es: "Primer Año", fr: "1ère Année Maternelle", en: "Nursery 1" }, abreviation: "PRE1" },
                                { libelles: { es: "Segundo Año", fr: "2ème Année Maternelle", en: "Nursery 2" }, abreviation: "PRE2" }
                            ]
                        },
                        {
                            libelles: { es: "Educación Primaria", fr: "Enseignement Primaire", en: "Primary Education" },
                            classes: [
                                { libelles: { es: "1º Primero", fr: "1ère Année (CP)", en: "1st Grade" }, abreviation: "1PRIM" },
                                { libelles: { es: "2º Segundo", fr: "2ème Année (CE1)", en: "2nd Grade" }, abreviation: "2PRIM" },
                                { libelles: { es: "3º Tercero", fr: "3ème Année (CE2)", en: "3rd Grade" }, abreviation: "3PRIM" },
                                { libelles: { es: "4º Cuarto", fr: "4ème Année (CM1)", en: "4th Grade" }, abreviation: "4PRIM" },
                                { libelles: { es: "5º Quinto", fr: "5ème Année (CM2)", en: "5th Grade" }, abreviation: "5PRIM" },
                                { libelles: { es: "6º Sexto", fr: "6ème Année", en: "6th Grade" }, abreviation: "6PRIM" }
                            ]
                        },
                        {
                            libelles: { es: "ESBA (Educación Secundaria Básica)", fr: "Enseignement Secondaire de Base", en: "Basic Secondary Education" },
                            classes: [
                                { libelles: { es: "1º de ESBA", fr: "1ère Année ESBA (6e)", en: "7th Grade" }, abreviation: "1ESBA" },
                                { libelles: { es: "2º de ESBA", fr: "2ème Année ESBA (5e)", en: "8th Grade" }, abreviation: "2ESBA" },
                                { libelles: { es: "3º de ESBA", fr: "3ème Année ESBA (4e)", en: "9th Grade" }, abreviation: "3ESBA" },
                                { libelles: { es: "4º de ESBA", fr: "4ème Année ESBA (3e)", en: "10th Grade" }, abreviation: "4ESBA" }
                            ]
                        },
                        {
                            libelles: { es: "Bachillerato", fr: "Enseignement Secondaire (2nd Cycle)", en: "High School" },
                            classes: [
                                { libelles: { es: "1º de Bachillerato", fr: "Seconde", en: "11th Grade" }, abreviation: "1BACH" },
                                { libelles: { es: "2º de Bachillerato", fr: "Première", en: "12th Grade" }, abreviation: "2BACH" },
                                { libelles: { es: "3º de Bachillerato", fr: "Terminale", en: "13th Grade" }, abreviation: "3BACH" }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

module.exports = EducationProfiles;
