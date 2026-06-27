package com.trustledger.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;
import com.trustledger.entity.Payment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    public byte[] generatePaymentReceipt(Payment payment) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            Document document = new Document(PageSize.A4, 40, 40, 50, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            BaseColor themeGold = new BaseColor(197, 160, 89);
            BaseColor darkGray = new BaseColor(51, 51, 51);
            BaseColor lightGray = new BaseColor(245, 245, 245);
            BaseColor borderColor = new BaseColor(220, 220, 220);

            // Fonts
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, themeGold);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, darkGray);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, darkGray);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11, darkGray);
            Font amountFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, themeGold);

            // 1. Header (Logo / Brand Name)
            Paragraph brand = new Paragraph("TRUST LEDGER", brandFont);
            brand.setAlignment(Element.ALIGN_CENTER);
            document.add(brand);
            
            Paragraph subBrand = new Paragraph("Gold Loan Management System", normalFont);
            subBrand.setAlignment(Element.ALIGN_CENTER);
            subBrand.setSpacingAfter(20);
            document.add(subBrand);

            // 2. Separator
            LineSeparator ls = new LineSeparator();
            ls.setLineColor(themeGold);
            document.add(new Chunk(ls));

            // 3. Receipt Title
            Paragraph receiptTitle = new Paragraph("OFFICIAL PAYMENT RECEIPT", titleFont);
            receiptTitle.setAlignment(Element.ALIGN_CENTER);
            receiptTitle.setSpacingBefore(15);
            receiptTitle.setSpacingAfter(15);
            document.add(receiptTitle);

            // 4. General Info Box (Date & Receipt No)
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(25);

            PdfPCell c1 = new PdfPCell(new Phrase("Receipt No: REC-" + String.format("%04d", payment.getId()), boldFont));
            c1.setBorder(Rectangle.NO_BORDER);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
            PdfPCell c2 = new PdfPCell(new Phrase("Date: " + payment.getPaymentDate().format(formatter), normalFont));
            c2.setBorder(Rectangle.NO_BORDER);
            c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            infoTable.addCell(c1);
            infoTable.addCell(c2);
            document.add(infoTable);

            // 5. Main Details Table
            PdfPTable mainTable = new PdfPTable(2);
            mainTable.setWidthPercentage(100);
            mainTable.setSpacingAfter(35);
            mainTable.setWidths(new float[]{1f, 2f});

            // Table Header
            PdfPCell th = new PdfPCell(new Phrase("TRANSACTION DETAILS", headerFont));
            th.setColspan(2);
            th.setBackgroundColor(themeGold);
            th.setPadding(10);
            th.setBorder(Rectangle.NO_BORDER);
            mainTable.addCell(th);

            // Rows
            addStyledRow(mainTable, "Customer Name", payment.getLoan().getCustomer().getName(), boldFont, normalFont, lightGray, false, borderColor);
            addStyledRow(mainTable, "Phone Number", payment.getLoan().getCustomer().getPhoneNumber(), boldFont, normalFont, BaseColor.WHITE, false, borderColor);
            addStyledRow(mainTable, "Loan ID", "TLG" + String.format("%010d", payment.getLoan().getId()), boldFont, normalFont, lightGray, false, borderColor);
            
            String prettyType = payment.getType().toString().replace("_", " ");
            addStyledRow(mainTable, "Payment Type", prettyType, boldFont, normalFont, BaseColor.WHITE, false, borderColor);
            
            String mode = payment.getRazorpayPaymentId() != null && !payment.getRazorpayPaymentId().isEmpty() ? "Online (" + payment.getRazorpayPaymentId() + ")" : "Cash";
            addStyledRow(mainTable, "Payment Mode", mode, boldFont, normalFont, lightGray, false, borderColor);
            
            // Amount Row
            PdfPCell amtLabel = new PdfPCell(new Phrase("Amount Paid", boldFont));
            amtLabel.setPadding(12);
            amtLabel.setBorderColor(themeGold);
            amtLabel.setBorderWidth(1.5f);
            amtLabel.setBackgroundColor(BaseColor.WHITE);
            
            PdfPCell amtVal = new PdfPCell(new Phrase("Rs. " + String.format("%.2f", payment.getAmount()), amountFont));
            amtVal.setPadding(12);
            amtVal.setBorderColor(themeGold);
            amtVal.setBorderWidth(1.5f);
            amtVal.setBackgroundColor(BaseColor.WHITE);
            
            mainTable.addCell(amtLabel);
            mainTable.addCell(amtVal);

            document.add(mainTable);

            // 6. Updated Balances Table
            PdfPTable balTable = new PdfPTable(2);
            balTable.setWidthPercentage(100);
            balTable.setSpacingAfter(40);
            balTable.setWidths(new float[]{1f, 2f});

            PdfPCell bth = new PdfPCell(new Phrase("UPDATED LOAN BALANCES", headerFont));
            bth.setColspan(2);
            bth.setBackgroundColor(darkGray);
            bth.setPadding(10);
            bth.setBorder(Rectangle.NO_BORDER);
            balTable.addCell(bth);

            addStyledRow(balTable, "Remaining Principal", "Rs. " + String.format("%.2f", payment.getLoan().getRemainingPrincipal()), boldFont, normalFont, lightGray, true, null);
            addStyledRow(balTable, "Pending Interest", "Rs. " + String.format("%.2f", payment.getLoan().getTotalPendingInterest()), boldFont, normalFont, BaseColor.WHITE, true, null);

            document.add(balTable);

            // 7. Footer
            document.add(new Chunk(ls));
            Paragraph footer = new Paragraph("Thank you for choosing Trust Ledger. This is a computer-generated receipt and does not require a physical signature.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, BaseColor.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(15);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }

    private void addStyledRow(PdfPTable table, String label, String value, Font boldFont, Font normalFont, BaseColor bgColor, boolean noBorder, BaseColor borderColor) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, boldFont));
        labelCell.setBackgroundColor(bgColor);
        labelCell.setPadding(10);
        if (noBorder) {
            labelCell.setBorder(Rectangle.NO_BORDER);
        } else {
            labelCell.setBorderColor(borderColor);
            labelCell.setBorderWidth(0.5f);
        }
        
        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "N/A", normalFont));
        valueCell.setBackgroundColor(bgColor);
        valueCell.setPadding(10);
        if (noBorder) {
            valueCell.setBorder(Rectangle.NO_BORDER);
        } else {
            valueCell.setBorderColor(borderColor);
            valueCell.setBorderWidth(0.5f);
        }
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
}
