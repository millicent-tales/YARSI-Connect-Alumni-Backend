const { z } = require("zod");

// Mandatory fields that are required for all cases
const mandatoryFields = {
  nimhsmsmh: z.string().min(1, "NIM wajib diisi"),
  tahun_lulus: z.string().min(1, "Tahun lulus wajib diisi"),
  nmmhsmsmh: z.string().min(1, "Nama mahasiswa wajib diisi"),
  kdptimsmh: z.string().min(1, "Kode PT wajib diisi"),
  kdpstmsmh: z.string().min(1, "Kode program studi wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
};

// Optional base fields
const optionalBaseFields = {
  telpomsmh: z.string().nullable(),
  emailmsmh: z.string().email("Format email tidak valid").nullable(),
  npwp: z.string().nullable(),
};

// Common fields across all choices (always required)
const commonFields = {
  f8: z.number().int().min(1).max(5, "Pilihan harus antara 1-5"),
  f1761: z.number().int().min(1).max(5),
  f1762: z.number().int().min(1).max(5),
  f1763: z.number().int().min(1).max(5),
  f1764: z.number().int().min(1).max(5),
  f1765: z.number().int().min(1).max(5),
  f1766: z.number().int().min(1).max(5),
  f1767: z.number().int().min(1).max(5),
  f1768: z.number().int().min(1).max(5),
  f1769: z.number().int().min(1).max(5),
  f1770: z.number().int().min(1).max(5),
  f1771: z.number().int().min(1).max(5),
  f1772: z.number().int().min(1).max(5),
  f1773: z.number().int().min(1).max(5),
  f1774: z.number().int().min(1).max(5),
};

// Common optional fields
const commonOptionalFields = {
  f21: z.number().int().min(1).max(5).optional(),
  f22: z.number().int().min(1).max(5).optional(),
  f23: z.number().int().min(1).max(5).optional(),
  f24: z.number().int().min(1).max(5).optional(),
  f25: z.number().int().min(1).max(5).optional(),
  f26: z.number().int().min(1).max(5).optional(),
  f27: z.number().int().min(1).max(5).optional(),
  f301: z.number().int().min(1).max(3).optional(),
  f401: z.number().int().min(0).max(1).optional(),
  f402: z.number().int().min(0).max(1).optional(),
  f403: z.number().int().min(0).max(1).optional(),
  f404: z.number().int().min(0).max(1).optional(),
  f405: z.number().int().min(0).max(1).optional(),
  f406: z.number().int().min(0).max(1).optional(),
  f407: z.number().int().min(0).max(1).optional(),
  f408: z.number().int().min(0).max(1).optional(),
  f409: z.number().int().min(0).max(1).optional(),
  f410: z.number().int().min(0).max(1).optional(),
  f411: z.number().int().min(0).max(1).optional(),
  f412: z.number().int().min(0).max(1).optional(),
  f413: z.number().int().min(0).max(1).optional(),
  f414: z.number().int().min(0).max(1).optional(),
  f415: z.number().int().min(0).max(1).optional(),
  f6: z.number().int().optional(),
  f7: z.number().int().optional(),
  f7a: z.number().int().optional(),
  f1001: z.number().int().min(1).max(5).optional(),
  f1601: z.number().int().min(0).max(1).optional(),
  f1602: z.number().int().min(0).max(1).optional(),
  f1603: z.number().int().min(0).max(1).optional(),
  f1604: z.number().int().min(0).max(1).optional(),
  f1605: z.number().int().min(0).max(1).optional(),
  f1606: z.number().int().min(0).max(1).optional(),
  f1607: z.number().int().min(0).max(1).optional(),
  f1608: z.number().int().min(0).max(1).optional(),
  f1609: z.number().int().min(0).max(1).optional(),
  f1610: z.number().int().min(0).max(1).optional(),
  f1611: z.number().int().min(0).max(1).optional(),
  f1612: z.number().int().min(0).max(1).optional(),
  f1613: z.number().int().min(0).max(1).optional(),
};

// Conditional fields based on f8 value
const conditionalFields = {
  // Fields that may be required based on f8=1
  f502: z.number().optional(),
  f505: z.number().optional(),
  f5a1: z.string().optional(),
  f5a2: z.string().optional(),
  f1101: z.number().int().min(1).max(7).optional(),
  f1102: z.string().optional().nullable(),
  f5b: z.string().optional(),
  f5d: z.number().optional(),
  f14: z.number().optional(),
  f15: z.number().optional(),

  // Fields that may be required based on f8=3
  f5c: z.string().optional(),

  // Fields that may be required based on f8=4
  f18a: z.string().optional(),
  f18b: z.string().optional(),
  f18c: z.string().optional(),
  f18d: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined))
    .refine((date) => !date || (date instanceof Date && !isNaN(date)), {
      message: "Field f18d harus berupa tanggal yang valid",
    }),

  // Common conditional fields
  f1201: z.number().int().min(1).max(7).optional(),
  f1202: z.string().optional().nullable(),
  f302: z.number().optional().nullable(),
  f303: z.number().optional().nullable(),
  f416: z.string().optional().nullable(),
  f1002: z.string().optional().nullable(),
  f1614: z.string().optional().nullable(),
};

// Define field sets for each f8 value
const fieldSets = {
  1: [
    "f502",
    "f505",
    "f5a1",
    "f5a2",
    "f1101",
    "f1102",
    "f5b",
    "f5d",
    "f14",
    "f15",
    "f1201", //
    "f1202",
    "f1761",
    "f1762",
    "f1763",
    "f1764",
    "f1765",
    "f1766",
    "f1767",
    "f1768",
    "f1769",
    "f1770",
    "f1771",
    "f1772",
    "f1773",
    "f1774",
    "f21",
    "f22",
    "f23",
    "f24",
    "f25",
    "f26",
    "f27",
    "F301",
    "f302",
    "f303",
    "f401",
    "f402",
    "f403",
    "f404",
    "f405",
    "f406",
    "f407",
    "f408",
    "f409",
    "f410",
    "f411",
    "f412",
    "f413",
    "f414",
    "f415",
    "f416",
    "f6",
    "f7",
    "f7a",
    "f1001",
    "f1002",
    "f1601",
    "f1602",
    "f1603",
    "f1604",
    "f1605",
    "f1606",
    "f1607",
    "f1608",
    "f1609",
    "f1610",
    "f1611",
    "f1612",
    "f1613",
    "f1614",
  ],
  2: [
    "f1201",
    "f1202",
    "f1761",
    "f1762",
    "f1763",
    "f1764",
    "f1765",
    "f1766",
    "f1767",
    "f1768",
    "f1769",
    "f1770",
    "f1771",
    "f1772",
    "f1773",
    "f1774",
    "f21",
    "f22",
    "f23",
    "f24",
    "f25",
    "f26",
    "f27",
    "f301",
    "f302",
    "f303",
    "f401",
    "f402",
    "f403",
    "f404",
    "f405",
    "f406",
    "f407",
    "f408",
    "f409",
    "f410",
    "f411",
    "f412",
    "f413",
    "f414",
    "f415",
    "f416",
    "f6",
    "f7",
    "f7a",
    "f1001",
    "f1002",
    "f1601",
    "f1602",
    "f1603",
    "f1604",
    "f1605",
    "f1606",
    "f1607",
    "f1608",
    "f1609",
    "f1610",
    "f1611",
    "f1612",
    "f1613",
    "f1614",
  ],
  3: [
    "f502",
    "f5c",
    "f5d",
    "f1201",
    "f1202",
    "f1761",
    "f1762",
    "f1763",
    "f1764",
    "f1765",
    "f1766",
    "f1767",
    "f1768",
    "f1769",
    "f1770",
    "f1771",
    "f1772",
    "f1773",
    "f1774",
    "f21",
    "f22",
    "f23",
    "f24",
    "f25",
    "f26",
    "f27",
    "f301",
    "f302",
    "f303",
    "f401",
    "f402",
    "f403",
    "f404",
    "f405",
    "f406",
    "f407",
    "f408",
    "f409",
    "f410",
    "f411",
    "f412",
    "f413",
    "f414",
    "f415",
    "f416",
    "f6",
    "f7",
    "f7a",
    "f1001",
    "f1002",
    "f1601",
    "f1602",
    "f1603",
    "f1604",
    "f1605",
    "f1606",
    "f1607",
    "f1608",
    "f1609",
    "f1610",
    "f1611",
    "f1612",
    "f1613",
    "f1614",
  ],
  4: [
    "f18a",
    "f18b",
    "f18c",
    "f18d",
    "f1201",
    "f1202",
    "f1761",
    "f1762",
    "f1763",
    "f1764",
    "f1765",
    "f1766",
    "f1767",
    "f1768",
    "f1769",
    "f1770",
    "f1771",
    "f1772",
    "f1773",
    "f1774",
    "f21",
    "f22",
    "f23",
    "f24",
    "f25",
    "f26",
    "f27",
    "f301",
    "f302",
    "f303",
    "f401",
    "f402",
    "f403",
    "f404",
    "f405",
    "f406",
    "f407",
    "f408",
    "f409",
    "f410",
    "f411",
    "f412",
    "f413",
    "f414",
    "f415",
    "f416",
    "f6",
    "f7",
    "f7a",
    "f1001",
    "f1002",
    "f1601",
    "f1602",
    "f1603",
    "f1604",
    "f1605",
    "f1606",
    "f1607",
    "f1608",
    "f1609",
    "f1610",
    "f1611",
    "f1612",
    "f1613",
    "f1614",
  ],
  5: [
    "f1201",
    "f1202",
    "f1761",
    "f1762",
    "f1763",
    "f1764",
    "f1765",
    "f1766",
    "f1767",
    "f1768",
    "f1769",
    "f1770",
    "f1771",
    "f1772",
    "f1773",
    "f1774",
    "f21",
    "f22",
    "f23",
    "f24",
    "f25",
    "f26",
    "f27",
    "f301",
    "f302",
    "f303",
    "f401",
    "f402",
    "f403",
    "f404",
    "f405",
    "f406",
    "f407",
    "f408",
    "f409",
    "f410",
    "f411",
    "f412",
    "f413",
    "f414",
    "f415",
    "f416",
    "f6",
    "f7",
    "f7a",
    "f1001",
    "f1002",
    "f1601",
    "f1602",
    "f1603",
    "f1604",
    "f1605",
    "f1606",
    "f1607",
    "f1608",
    "f1609",
    "f1610",
    "f1611",
    "f1612",
    "f1613",
    "f1614",
  ],
};

// Base schema with all possible fields
const BaseSchema = z.object({
  ...mandatoryFields,
  ...optionalBaseFields,
  ...commonFields,
  ...commonOptionalFields,
  ...conditionalFields,
});

// Create the final schema with conditional validation
const TracerStudySchema = BaseSchema.superRefine((data, ctx) => {
  // Get the choice from f8
  const choice = data.f8;

  // Check for invalid fields based on f8 value
  const allowedFields = new Set([
    ...Object.keys(mandatoryFields),
    ...Object.keys(optionalBaseFields),
    ...Object.keys(commonFields),
    ...Object.keys(commonOptionalFields),
    ...(fieldSets[choice] || []),
  ]);

  // Check for fields that shouldn't be present based on f8 value
  Object.keys(data).forEach((field) => {
    if (
      !allowedFields.has(field) &&
      data[field] !== undefined &&
      data[field] !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field ${field} tidak diperbolehkan untuk pilihan ${choice}`,
        path: [field],
      });
    }
  });

  // Validate required fields based on f8 value
  if (choice === 1) {
    // Required fields for choice 1
    const requiredFields = ["f502", "f14", "f15", "f1201"];
    requiredFields.forEach((field) => {
      if (data[field] === undefined || data[field] === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Field ${field} wajib diisi untuk pilihan 1`,
          path: [field],
        });
      }
    });

    if (data.f1101 === 7) {
      if (!data.f1102) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field f1102 wajib diisi ketika f1101 bernilai 7",
          path: ["f1102"],
        });
      }
    } else {
      // When f1101 is not 7, f1102 must be null
      if (data.f1102 !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Field f1102 harus bernilai null ketika f1101 tidak bernilai 7",
          path: ["f1102"],
        });
      }
    };
  } else if (choice === 2 || choice === 5) {
    // Required fields for choices 2 and 5
    if (!data.f1201) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field f1201 wajib diisi untuk pilihan 2 atau 5",
        path: ["f1201"],
      });
    }
  } else if (choice === 3) {
    // Required fields for choice 3
    if (!data.f1201) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field f1201 wajib diisi untuk pilihan 3",
        path: ["f1201"],
      });
    }
  } else if (choice === 4) {
    // Required fields for choice 4
    if (!data.f1201) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field f1201 wajib diisi untuk pilihan 4",
        path: ["f1201"],
      });
    }
  }

  // Validate conditional field
  if (data.f1201 === 7) { // SETIAP 1, 2, 3, 4, dan 5
    if (!data.f1202) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field f1202 wajib diisi ketika f1201 bernilai 7",
        path: ["f1202"],
      });
    }
  } else if (data.f1202 !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Field f1202 harus bernilai null ketika f1201 tidak bernilai 7",
      path: ["f1202"],
    });
  }

  if (data.f301) {
    if (data.f301 === 1) { // SETIAP 1, 2, 3, 4, dan 5
      if (!data.f302) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field f302 wajib diisi ketika f301 bernilai 1",
          path: ["f302"],
        });
      }
      if (data.f303 !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field f303 harus bernilai null ketika f301 bernilai 1",
          path: ["f303"],
        });
      }
    } else if (data.f301 === 2) {
      if (!data.f303) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field f303 wajib diisi ketika f301 bernilai 2",
          path: ["f303"],
        });
      }
      if (data.f302 !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field f302 harus bernilai null ketika f301 bernilai 2",
          path: ["f302"],
        });
      }
    } else if (data.f301 === 3) {
      if (data.f302) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field f302 tidak boleh diisi ketika f301 bernilai 3",
          path: ["f302"],
        });
      }
      if (data.f303 !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Field f303 harus bernilai null ketika f301 bernilai 3",
          path: ["f303"],
        });
      }
    }
  }

  if (data.f415 === 1) { // SETIAP 1, 2, 3, 4, dan 5
    if (!data.f416) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field f416 wajib diisi ketika f415 bernilai 1",
        path: ["f416"],
      });
    }
  } else if (data.f416 !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Field f416 harus bernilai null ketika f415 bernilai 0",
      path: ["f416"],
    });
  }

  if (data.f1001 === 5) { // SETIAP 1, 2, 3, 4, dan 5
    if (!data.f1002) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field f1002 wajib diisi ketika f1001 bernilai 5",
        path: ["f1002"],
      });
    }
  } else if (data.f1002 !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Field f1002 harus bernilai null ketika f1001 tidak bernilai 5",
      path: ["f1002"],
    });
  }

  if (data.f1613 === 1) { // SETIAP 1, 2, 3, 4, dan 5
    if (!data.f1614) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Field f1614 wajib diisi ketika f1613 bernilai 1",
        path: ["f1614"],
      });
    }
  } else if (data.f1614 !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Field f1614 harus bernilai null ketika f1613 bernilai 0",
      path: ["f1614"],
    });
  }

  // Additional validation for specific f8 values to ensure non-allowed fields are not present
  switch (choice) {
    case 1:
      // Check for fields that shouldn't be present in f8=1
      if (data.f5c || data.f18a || data.f18b || data.f18c || data.f18d) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Fields f5c, f18a, f18b, f18c, f18d tidak diperbolehkan untuk pilihan 1",
          path: ["f8"],
        });
      }
      break;

    case 2:
      // Check for fields that shouldn't be present in f8=2
      if (
        data.f502 ||
        data.f505 ||
        data.f5a1 ||
        data.f5a2 ||
        data.f1101 ||
        data.f1102 ||
        data.f5b ||
        data.f5c ||
        data.f5d ||
        data.f14 ||
        data.f15 ||
        data.f18a ||
        data.f18b ||
        data.f18c ||
        data.f18d
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Fields terkait pilihan 1, 3, dan 4 tidak diperbolehkan untuk pilihan 2",
          path: ["f8"],
        });
      }
      break;

    case 3:
      // Check for fields that shouldn't be present in f8=3
      if (
        data.f505 || 
        data.f5a1 ||
        data.f5a2 ||
        data.f1101 ||
        data.f1102 ||
        data.f5b ||
        data.f14 ||
        data.f15 ||
        data.f18a ||
        data.f18b ||
        data.f18c ||
        data.f18d
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Fields terkait pilihan 1 dan 4 tidak diperbolehkan untuk pilihan 3",
          path: ["f8"],
        });
      }
      break;

    case 4:
      // cek field yang gak boleh ada di value 4
      if (
        data.f502 ||
        data.f505 ||
        data.f5a1 ||
        data.f5a2 ||
        data.f1101 ||
        data.f1102 ||
        data.f5b ||
        data.f5c ||
        data.f5d ||
        data.f14 ||
        data.f15
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Fields terkait pilihan 1 dan 3 tidak diperbolehkan untuk pilihan 4",
          path: ["f8"],
        });
      }
      break;

    case 5:
      // Check for fields that shouldn't be present in f8=5
      if (
        data.f502 ||
        data.f505 ||
        data.f5a1 ||
        data.f5a2 ||
        data.f1101 ||
        data.f1102 ||
        data.f5b ||
        data.f5c ||
        data.f5d ||
        data.f14 ||
        data.f15 ||
        data.f18a ||
        data.f18b ||
        data.f18c ||
        data.f18d
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Fields terkait pilihan 1, 3, dan 4 tidak diperbolehkan untuk pilihan 5",
          path: ["f8"],
        });
      }
      break;
  }
});

exports.validateTracerStudy = (req, res, next) => {
  try {
    const validatedData = TracerStudySchema.parse(req.body);
    req.validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Validasi gagal",
        errors: error.errors,
      });
    }
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};