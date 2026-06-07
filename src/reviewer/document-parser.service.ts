import { Injectable, BadRequestException } from '@nestjs/common';
import PdfParse from 'pdf-parse'
import * as mammoth from 'mammoth';

@Injectable()
export class DocumentParserService {
  async extractText(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No document provided.');
    }

    const { mimetype, buffer, originalname } = file;
    let extractedText = '';

    try {
      if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
        const data = await PdfParse(buffer);
        extractedText = data.text;
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        originalname.endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else {
        throw new BadRequestException('Unsupported file format. Only .pdf and .docx are supported.');
      }
    } catch (error) {
      throw new BadRequestException(`Failed to parse document: ${error.message}`);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new BadRequestException('The uploaded document contains no readable text.');
    }

    return extractedText.trim();
  }
}
