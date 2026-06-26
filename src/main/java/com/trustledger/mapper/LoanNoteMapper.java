package com.trustledger.mapper;

import com.trustledger.dto.LoanNoteDto;
import com.trustledger.entity.LoanNote;

public final class LoanNoteMapper {

    private LoanNoteMapper() {
    }

    public static LoanNoteDto toDto(LoanNote note) {
        if (note == null) {
            return null;
        }

        Long loanId = note.getLoan() != null ? note.getLoan().getId() : null;
        return new LoanNoteDto(
                note.getId(),
                loanId,
                note.getNoteText(),
                note.getCreatedAt()
        );
    }
}
