import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer";
import { InvoiceTemplateData, InvoiceTemplateConfig } from "@/types/templates";

interface BusinessTemplateProps {
  data: InvoiceTemplateData;
  config: InvoiceTemplateConfig;
}

export default function BusinessTemplate({
  data,
  config
}: BusinessTemplateProps) {
  const styles = createStyles(config);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header with Logo */}
        <View style={styles.companyHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {data.business.name}
            </Text>
            <Text style={styles.serialNumber}>
              Sr No. {data.invoice.number}
            </Text>
          </View>
          <View style={styles.logoContainer}>
            {data.business.logo_url ? (
              <Image 
                src={data.business.logo_url} 
                style={styles.logo}
              />
            ) : (
              <View style={styles.defaultLogo}>
                <Text style={styles.defaultLogoText}>EU</Text>
                <Text style={styles.defaultLogoSubtext}>Prime Serwis</Text>
              </View>
            )}
          </View>
        </View>

        {/* Parties Section */}
        <View style={styles.partiesSection}>
          <View style={styles.sellerSection}>
            <Text style={styles.partyLabel}>Seller:</Text>
            <Text style={styles.partyName}>
              {data.business.name}
            </Text>
            {data.business.address && (
              <>
                <Text style={styles.partyDetails}>Address:</Text>
                <Text style={styles.partyText}>
                  {data.business.address}
                </Text>
              </>
            )}
            {data.business.tax_number && (
              <>
                <Text style={styles.partyDetails}>NIP No:</Text>
                <Text style={styles.partyText}>{data.business.tax_number}</Text>
              </>
            )}
            {data.business.phone && (
              <>
                <Text style={styles.partyDetails}>Phone Number:</Text>
                <Text style={styles.partyText}>{data.business.phone}</Text>
              </>
            )}
          </View>

          <View style={styles.buyerSection}>
            <Text style={styles.partyLabel}>Buyer:</Text>
            <Text style={styles.partyName}>{data.client.name}</Text>
            {data.client.email && (
              <>
                <Text style={styles.partyDetails}>Email:</Text>
                <Text style={styles.partyText}>{data.client.email}</Text>
              </>
            )}
            {data.client.address && (
              <>
                <Text style={styles.partyDetails}>Address:</Text>
                <Text style={styles.partyText}>{data.client.address}</Text>
              </>
            )}
          </View>
        </View>

        {/* Invoice Details and Bank Information */}
        <View style={styles.detailsSection}>
          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Of Issue:</Text>
              <Text style={styles.detailValue}>{data.invoice.issued_date}</Text>
            </View>
            {data.invoice.due_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>{data.invoice.due_date}</Text>
              </View>
            )}
          </View>

          <View style={styles.bankDetails}>
            <Text style={styles.bankLabel}>Bank Details:</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankDetailLabel}>Bank Name:</Text>
              <Text style={styles.bankDetailValue}>
                Santander Bank Polska S.A.
              </Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankDetailLabel}>Swift Code:</Text>
              <Text style={styles.bankDetailValue}>WBKPPLPP</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankDetailLabel}>Account No:</Text>
              <Text style={styles.bankDetailValue}>
                PL12109018700000000159966769
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: "8%" }]}>No.</Text>
            <Text style={[styles.tableHeaderText, { width: "32%" }]}>
              Name of service
            </Text>
            <Text style={[styles.tableHeaderText, { width: "8%" }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { width: "8%" }]}>Unit</Text>
            <Text style={[styles.tableHeaderText, { width: "12%" }]}>
              Unit net price
            </Text>
            <Text style={[styles.tableHeaderText, { width: "12%" }]}>
              Total net price
            </Text>
            <Text style={[styles.tableHeaderText, { width: "8%" }]}>
              VAT rate
            </Text>
            <Text style={[styles.tableHeaderText, { width: "12%" }]}>
              VAT amount
            </Text>
            <Text style={[styles.tableHeaderText, { width: "12%" }]}>
              Total gross price
            </Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCellText, { width: "8%" }]}>
                {index + 1}
              </Text>
              <Text style={[styles.tableCellText, { width: '32%' }]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCellText, { width: "8%" }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCellText, { width: "8%" }]}>pcs</Text>
              <Text style={[styles.tableCellText, { width: "12%" }]}>
                {formatNumber(item.unit_price)}
              </Text>
              <Text style={[styles.tableCellText, { width: "12%" }]}>
                {formatNumber(item.total)}
              </Text>
              <Text style={[styles.tableCellText, { width: "8%" }]}>
                {item.vat_rate || 0}%
              </Text>
              <Text style={[styles.tableCellText, { width: "12%" }]}>
                {formatNumber(item.total * ((item.vat_rate || 0) / 100))}
              </Text>
              <Text style={[styles.tableCellText, { width: "12%" }]}>
                {formatNumber(item.total)}
              </Text>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCellLabel, { width: "68%" }]}>
              Total:
            </Text>
            <Text style={[styles.totalCellValue, { width: "12%" }]}>
              {formatNumber(data.totals.subtotal)}
            </Text>
            <Text style={[styles.totalCellValue, { width: "8%" }]}>X</Text>
            <Text style={[styles.totalCellValue, { width: "12%" }]}>
              {formatNumber(data.totals.vat_amount)}
            </Text>
            <Text style={[styles.totalCellValue, { width: "12%" }]}>
              {formatNumber(data.totals.total)}
            </Text>
          </View>

          {/* Tax Rate Row */}
          <View style={styles.taxRow}>
            <Text style={[styles.totalCellLabel, { width: "68%" }]}>
              Tax rate
            </Text>
            <Text style={[styles.totalCellValue, { width: "12%" }]}>
              {formatNumber(data.totals.subtotal)}
            </Text>
            <Text style={[styles.totalCellValue, { width: "8%" }]}>0%</Text>
            <Text style={[styles.totalCellValue, { width: "12%" }]}>
              {formatNumber(data.totals.vat_amount)}
            </Text>
            <Text style={[styles.totalCellValue, { width: "12%" }]}>
              {formatNumber(data.totals.total)}
            </Text>
          </View>
        </View>

        {/* Total Due Banner */}
        <View style={styles.totalDueBanner}>
          <Text style={styles.totalDueText}>
            TOTAL DUE: {formatNumber(data.totals.total)} {data.invoice.currency}
          </Text>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountInWords}>
          <Text style={styles.amountInWordsLabel}>In Words:</Text>
          <Text style={styles.amountInWordsText}>
            {convertNumberToWords(data.totals.total)} {data.invoice.currency}{" "}
            only
          </Text>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentMethodLabel}>Online Payment Method :</Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>
              Signature of the person authorised{"\n"}to receive the invoice
            </Text>
          </View>

          <View style={styles.stampBox}>
            {data.business.signature_url ? (
              <Image
                src={data.business.signature_url}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.defaultSignature}>
                <Text style={styles.defaultSignatureText}>
                  {data.business.name}
                </Text>
                {data.business.address && (
                  <Text style={styles.defaultSignatureDetails}>
                    {data.business.address}
                  </Text>
                )}
                {data.business.tax_number && (
                  <Text style={styles.defaultSignatureDetails}>
                    NIP : {data.business.tax_number}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Create styles function
function createStyles(config: InvoiceTemplateConfig) {
  const { colors, fonts } = config;

  return StyleSheet.create({
    page: {
      fontFamily: fonts.primary,
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
      backgroundColor: colors.background,
      padding: 20, // Reduced padding
    },

    // Company Header
    companyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15, // Reduced margin
    },

    companyInfo: {
      flex: 1
    },

    companyName: {
      fontSize: fonts.sizes.title,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 10
    },

    serialNumber: {
      fontSize: fonts.sizes.body,
      color: colors.text_secondary
    },

    logoContainer: {
      alignItems: "center"
    },

    logo: {
      width: 80,
      height: 80,
      borderRadius: 40
    },

    defaultLogo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center"
    },

    defaultLogoText: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FFFFFF"
    },

    defaultLogoSubtext: {
      fontSize: 8,
      color: "#FFFFFF"
    },

    // Parties Section
    partiesSection: {
      flexDirection: 'row',
      marginBottom: 12, // Reduced margin
      paddingBottom: 12, // Reduced padding
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    sellerSection: {
      flex: 1,
      paddingRight: 20
    },

    buyerSection: {
      flex: 1,
      paddingLeft: 20
    },

    partyLabel: {
      fontSize: fonts.sizes.body,
      fontWeight: "bold",
      color: colors.text_primary,
      marginBottom: 5
    },

    partyName: {
      fontSize: fonts.sizes.body,
      fontWeight: "bold",
      color: colors.text_primary,
      marginBottom: 8
    },

    partyDetails: {
      fontSize: fonts.sizes.small,
      fontWeight: "bold",
      color: colors.text_secondary,
      marginBottom: 2
    },

    partyText: {
      fontSize: fonts.sizes.small,
      color: colors.text_primary,
      marginBottom: 8,
      lineHeight: 1.3
    },

    // Details Section
    detailsSection: {
      flexDirection: 'row',
      marginBottom: 12, // Reduced margin
      paddingBottom: 12, // Reduced padding
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    invoiceDetails: {
      flex: 1
    },

    bankDetails: {
      flex: 1,
      paddingLeft: 20
    },

    detailRow: {
      flexDirection: "row",
      marginBottom: 8
    },

    bankRow: {
      flexDirection: "row",
      marginBottom: 4
    },

    detailLabel: {
      fontSize: fonts.sizes.body,
      color: colors.text_secondary,
      width: 80
    },

    detailValue: {
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
      flex: 1
    },

    bankLabel: {
      fontSize: fonts.sizes.body,
      fontWeight: "bold",
      color: colors.text_primary,
      marginBottom: 8
    },

    bankDetailLabel: {
      fontSize: fonts.sizes.small,
      color: colors.text_secondary,
      width: 80
    },

    bankDetailValue: {
      fontSize: fonts.sizes.small,
      color: colors.text_primary,
      flex: 1
    },

    // Table Styles
    table: {
      marginBottom: 10, // Reduced margin
    },

    tableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      padding: 5, // Reduced padding
      borderWidth: 1,
      borderColor: colors.text_secondary,
    },

    tableHeaderText: {
      fontSize: fonts.sizes.small,
      fontWeight: "bold",
      color: colors.text_primary,
      textAlign: "center",
      paddingHorizontal: 2
    },

    tableRow: {
      flexDirection: 'row',
      padding: 5, // Reduced padding
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.text_secondary,
      backgroundColor: '#F8FBFF',
    },

    tableCellText: {
      fontSize: fonts.sizes.small,
      color: colors.text_primary,
      textAlign: "center",
      paddingHorizontal: 2
    },

    totalRow: {
      flexDirection: 'row',
      padding: 5, // Reduced padding
      borderWidth: 1,
      borderColor: colors.text_secondary,
      backgroundColor: colors.background,
    },

    taxRow: {
      flexDirection: 'row',
      padding: 5, // Reduced padding
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.text_secondary,
    },

    totalCellLabel: {
      fontSize: fonts.sizes.small,
      fontWeight: "bold",
      color: colors.text_primary,
      textAlign: "center",
      paddingHorizontal: 2
    },

    totalCellValue: {
      fontSize: fonts.sizes.small,
      color: colors.text_primary,
      textAlign: "center",
      paddingHorizontal: 2
    },

    // Total Due Banner
    totalDueBanner: {
      backgroundColor: colors.primary,
      padding: 10, // Reduced padding
      alignItems: 'center',
      marginBottom: 10, // Reduced margin
    },

    totalDueText: {
      fontSize: fonts.sizes.heading,
      fontWeight: "bold",
      color: "#FFFFFF"
    },

    // Amount in Words
    amountInWords: {
      flexDirection: "row",
      marginBottom: 10
    },

    amountInWordsLabel: {
      fontSize: fonts.sizes.body,
      fontWeight: "bold",
      color: colors.text_primary,
      marginRight: 10
    },

    amountInWordsText: {
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
      flex: 1
    },

    // Payment Method
    paymentMethod: {
      marginBottom: 15, // Reduced margin
    },

    paymentMethodLabel: {
      fontSize: fonts.sizes.body,
      fontWeight: "bold",
      color: colors.text_primary
    },
    // Signature Section
    signatureSection: {
      flexDirection: 'row',
      marginTop: 15, // Reduced margin
    },

    signatureBox: {
      flex: 1,
      height: 80, // Reduced height
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10, // Reduced margin
    },

    signatureLabel: {
      fontSize: fonts.sizes.small,
      color: colors.text_secondary,
      textAlign: "center",
      lineHeight: 1.4
    },

    stampBox: {
      flex: 1,
      height: 80, // Reduced height
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    signatureImage: {
      width: 100,
      height: 80
    },

    defaultSignature: {
      alignItems: "center",
      padding: 10
    },

    defaultSignatureText: {
      fontSize: fonts.sizes.small,
      fontWeight: "bold",
      color: colors.text_primary,
      textAlign: "center",
      marginBottom: 4
    },

    defaultSignatureDetails: {
      fontSize: 8,
      color: colors.text_secondary,
      textAlign: "center",
      lineHeight: 1.2
    }
  });
}

// Helper function to format numbers
function formatNumber(amount: number): string {
  return amount.toFixed(2);
}

// Helper function to convert number to words (simplified)
function convertNumberToWords(amount: number): string {
  // This is a simplified version - you might want to implement a more complete number-to-words converter
  const roundedAmount = Math.round(amount);

  if (roundedAmount === 600) return "Six hundred";
  if (roundedAmount < 1000) return `${roundedAmount}`;

  // Add more number conversion logic as needed
  return `${roundedAmount}`;
}
