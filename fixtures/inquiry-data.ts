import type { GrpcResponse } from "@/lib/grpc/generated/service";

/**
 * STATIC_INQUIRY_DATA mirrors the CBS Enquiry/Inquiry dataset wire responses (.response/inquiry-data.json).
 * Formatted exactly as GrpcResponse with Protobuf struct payload.
 * Keyed by inquiry recordId / controllerName (e.g. "GET.TODAY.ENTRY" / "TODAY.TXN.ENTRY").
 */
export const STATIC_INQUIRY_DATA: Record<string, GrpcResponse> = {
  "GET.TODAY.ENTRY": {
    errors: [],
    status: "SUCCESS",
    statusCode: 200,
    idempotencyKey: "",
    message: "record successfully processed!",
    data: {
      fields: {
        records: {
          list_value: {
            values: [
              {
                struct_value: {
                  fields: {
                    recordId: {
                      string_value:
                        "2026-01-03*100*CR*JB9999*JB0886*BDT*6001*0100038443695.26003.007QE",
                    },
                    auditData: {
                      struct_value: {
                        fields: {
                          recStatus: {
                            string_value: "",
                          },
                          recCurrNumber: {
                            number_value: 0,
                          },
                          recInputter: {
                            string_value: "",
                          },
                          recInputTime: {
                            string_value: "",
                          },
                          recAuthorizer: {
                            string_value: "",
                          },
                          recAuthTime: {
                            string_value: "",
                          },
                          recBranchCode: {
                            string_value: "",
                          },
                        },
                      },
                    },
                    txnReference: {
                      string_value: "FT26003007QE",
                    },
                    txnCode: {
                      string_value: "100",
                    },
                    valueDate: {
                      string_value: "2026-01-03",
                    },
                    accountNumber: {
                      string_value: "0100038443695",
                    },
                    accountTitle: {
                      string_value: "A Lotif Talukder",
                    },
                    currency: {
                      string_value: "BDT",
                    },
                    txnAmount: {
                      number_value: 10,
                    },
                    inputter: {
                      string_value: "SYSUSER",
                    },
                    authorizer: {
                      string_value: "SYSUSER",
                    },
                    eventAction: {
                      list_value: {
                        values: [
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH I recordId",
                                },
                                cmdButton: {
                                  string_value: "EDIT",
                                },
                              },
                            },
                          },
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH A recordId",
                                },
                                cmdButton: {
                                  string_value: "AUTH",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                struct_value: {
                  fields: {
                    recordId: {
                      string_value:
                        "2026-01-03*100*DR*JB9999*JB0102*BDT*6004*0100001420806.26003.007QD",
                    },
                    auditData: {
                      struct_value: {
                        fields: {
                          recStatus: {
                            string_value: "",
                          },
                          recCurrNumber: {
                            number_value: 0,
                          },
                          recInputter: {
                            string_value: "",
                          },
                          recInputTime: {
                            string_value: "",
                          },
                          recAuthorizer: {
                            string_value: "",
                          },
                          recAuthTime: {
                            string_value: "",
                          },
                          recBranchCode: {
                            string_value: "",
                          },
                        },
                      },
                    },
                    txnReference: {
                      string_value: "FT26003007QE",
                    },
                    txnCode: {
                      string_value: "100",
                    },
                    valueDate: {
                      string_value: "2026-01-03",
                    },
                    accountNumber: {
                      string_value: "0100001420806",
                    },
                    accountTitle: {
                      string_value: "MD IMRAN HASAN",
                    },
                    currency: {
                      string_value: "BDT",
                    },
                    txnAmount: {
                      number_value: 10,
                    },
                    inputter: {
                      string_value: "SYSUSER",
                    },
                    authorizer: {
                      string_value: "SYSUSER",
                    },
                    eventAction: {
                      list_value: {
                        values: [
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH I recordId",
                                },
                                cmdButton: {
                                  string_value: "EDIT",
                                },
                              },
                            },
                          },
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH A recordId",
                                },
                                cmdButton: {
                                  string_value: "AUTH",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                struct_value: {
                  fields: {
                    recordId: {
                      string_value:
                        "2026-01-03*120*CR*JB9999*JB0102*BDT*6004*0100001420806.26003.007QG",
                    },
                    auditData: {
                      struct_value: {
                        fields: {
                          recStatus: {
                            string_value: "",
                          },
                          recCurrNumber: {
                            number_value: 0,
                          },
                          recInputter: {
                            string_value: "",
                          },
                          recInputTime: {
                            string_value: "",
                          },
                          recAuthorizer: {
                            string_value: "",
                          },
                          recAuthTime: {
                            string_value: "",
                          },
                          recBranchCode: {
                            string_value: "",
                          },
                        },
                      },
                    },
                    txnReference: {
                      string_value: "FT26003007QG",
                    },
                    txnCode: {
                      string_value: "120",
                    },
                    valueDate: {
                      string_value: "2026-01-03",
                    },
                    accountNumber: {
                      string_value: "0100001420806",
                    },
                    accountTitle: {
                      string_value: "MD IMRAN HASAN",
                    },
                    currency: {
                      string_value: "BDT",
                    },
                    txnAmount: {
                      number_value: 20,
                    },
                    inputter: {
                      string_value: "SYSUSER",
                    },
                    authorizer: {
                      string_value: "SYSUSER",
                    },
                    eventAction: {
                      list_value: {
                        values: [
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH I recordId",
                                },
                                cmdButton: {
                                  string_value: "EDIT",
                                },
                              },
                            },
                          },
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH A recordId",
                                },
                                cmdButton: {
                                  string_value: "AUTH",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                struct_value: {
                  fields: {
                    recordId: {
                      string_value:
                        "2026-01-03*120*CR*JB9999*JB0886*BDT*6001*0100038443695.26003.003WG",
                    },
                    auditData: {
                      struct_value: {
                        fields: {
                          recStatus: {
                            string_value: "",
                          },
                          recCurrNumber: {
                            number_value: 0,
                          },
                          recInputter: {
                            string_value: "",
                          },
                          recInputTime: {
                            string_value: "",
                          },
                          recAuthorizer: {
                            string_value: "",
                          },
                          recAuthTime: {
                            string_value: "",
                          },
                          recBranchCode: {
                            string_value: "",
                          },
                        },
                      },
                    },
                    txnReference: {
                      string_value: "FT26003003VH",
                    },
                    txnCode: {
                      string_value: "120",
                    },
                    valueDate: {
                      string_value: "2026-01-03",
                    },
                    accountNumber: {
                      string_value: "0100038443695",
                    },
                    accountTitle: {
                      string_value: "A Lotif Talukder",
                    },
                    currency: {
                      string_value: "BDT",
                    },
                    txnAmount: {
                      number_value: 20,
                    },
                    inputter: {
                      string_value: "SYSUSER",
                    },
                    authorizer: {
                      string_value: "SYSUSER",
                    },
                    eventAction: {
                      list_value: {
                        values: [
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH I recordId",
                                },
                                cmdButton: {
                                  string_value: "EDIT",
                                },
                              },
                            },
                          },
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH A recordId",
                                },
                                cmdButton: {
                                  string_value: "AUTH",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                struct_value: {
                  fields: {
                    recordId: {
                      string_value:
                        "2026-01-03*120*CR*JB9999*JB0886*BDT*6001*0100038443695.26003.003WI",
                    },
                    auditData: {
                      struct_value: {
                        fields: {
                          recStatus: {
                            string_value: "",
                          },
                          recCurrNumber: {
                            number_value: 0,
                          },
                          recInputter: {
                            string_value: "",
                          },
                          recInputTime: {
                            string_value: "",
                          },
                          recAuthorizer: {
                            string_value: "",
                          },
                          recAuthTime: {
                            string_value: "",
                          },
                          recBranchCode: {
                            string_value: "",
                          },
                        },
                      },
                    },
                    txnReference: {
                      string_value: "FT26003003VQ",
                    },
                    txnCode: {
                      string_value: "120",
                    },
                    valueDate: {
                      string_value: "2026-01-03",
                    },
                    accountNumber: {
                      string_value: "0100038443695",
                    },
                    accountTitle: {
                      string_value: "A Lotif Talukder",
                    },
                    currency: {
                      string_value: "BDT",
                    },
                    txnAmount: {
                      number_value: 50,
                    },
                    inputter: {
                      string_value: "SYSUSER",
                    },
                    authorizer: {
                      string_value: "SYSUSER",
                    },
                    eventAction: {
                      list_value: {
                        values: [
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH I recordId",
                                },
                                cmdButton: {
                                  string_value: "EDIT",
                                },
                              },
                            },
                          },
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH A recordId",
                                },
                                cmdButton: {
                                  string_value: "AUTH",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                struct_value: {
                  fields: {
                    recordId: {
                      string_value:
                        "2026-01-03*120*CR*JB9999*JB0886*BDT*6001*0100038443695.26003.003WK",
                    },
                    auditData: {
                      struct_value: {
                        fields: {
                          recStatus: {
                            string_value: "",
                          },
                          recCurrNumber: {
                            number_value: 0,
                          },
                          recInputter: {
                            string_value: "",
                          },
                          recInputTime: {
                            string_value: "",
                          },
                          recAuthorizer: {
                            string_value: "",
                          },
                          recAuthTime: {
                            string_value: "",
                          },
                          recBranchCode: {
                            string_value: "",
                          },
                        },
                      },
                    },
                    txnReference: {
                      string_value: "FT26003003VP",
                    },
                    txnCode: {
                      string_value: "120",
                    },
                    valueDate: {
                      string_value: "2026-01-03",
                    },
                    accountNumber: {
                      string_value: "0100038443695",
                    },
                    accountTitle: {
                      string_value: "A Lotif Talukder",
                    },
                    currency: {
                      string_value: "BDT",
                    },
                    txnAmount: {
                      number_value: 50,
                    },
                    inputter: {
                      string_value: "SYSUSER",
                    },
                    authorizer: {
                      string_value: "SYSUSER",
                    },
                    eventAction: {
                      list_value: {
                        values: [
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH I recordId",
                                },
                                cmdButton: {
                                  string_value: "EDIT",
                                },
                              },
                            },
                          },
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH A recordId",
                                },
                                cmdButton: {
                                  string_value: "AUTH",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
              {
                struct_value: {
                  fields: {
                    recordId: {
                      string_value:
                        "2026-01-03*120*CR*JB9999*JB0886*BDT*6001*0100038443695.26003.003WM",
                    },
                    auditData: {
                      struct_value: {
                        fields: {
                          recStatus: {
                            string_value: "",
                          },
                          recCurrNumber: {
                            number_value: 0,
                          },
                          recInputter: {
                            string_value: "",
                          },
                          recInputTime: {
                            string_value: "",
                          },
                          recAuthorizer: {
                            string_value: "",
                          },
                          recAuthTime: {
                            string_value: "",
                          },
                          recBranchCode: {
                            string_value: "",
                          },
                        },
                      },
                    },
                    txnReference: {
                      string_value: "FT26003003VO",
                    },
                    txnCode: {
                      string_value: "120",
                    },
                    valueDate: {
                      string_value: "2026-01-03",
                    },
                    accountNumber: {
                      string_value: "0100038443695",
                    },
                    accountTitle: {
                      string_value: "A Lotif Talukder",
                    },
                    currency: {
                      string_value: "BDT",
                    },
                    txnAmount: {
                      number_value: 50,
                    },
                    inputter: {
                      string_value: "SYSUSER",
                    },
                    authorizer: {
                      string_value: "SYSUSER",
                    },
                    eventAction: {
                      list_value: {
                        values: [
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH I recordId",
                                },
                                cmdButton: {
                                  string_value: "EDIT",
                                },
                              },
                            },
                          },
                          {
                            struct_value: {
                              fields: {
                                cmdFor: {
                                  string_value: "BRANCH A recordId",
                                },
                                cmdButton: {
                                  string_value: "AUTH",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    },
    timestamp: "2026-10-05T10:37:34.053263987Z",
  },
};
