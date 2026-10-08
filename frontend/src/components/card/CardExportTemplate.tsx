'use client';

import React from 'react';
import { MembershipCardData } from '@/types';
import { CardCanvas, CARD_W, CARD_H, cardTierFor } from './CardArt';

interface CardExportTemplateProps {
  card: MembershipCardData;
  qrCodeDataUrl: string;
  side: 'front' | 'back';
  verifiedLabel: string;
  notVerifiedLabel: string;
  idLabel?: string;
  validLabel?: string;
}

/** 1:1 card face (856 x 540) captured by html-to-image for PNG and PDF export. */
export const CardExportTemplate: React.FC<CardExportTemplateProps> = ({ card, ...rest }) => (
  <CardCanvas card={card} tier={cardTierFor(card.role)} {...rest} />
);

export const CARD_EXPORT_WIDTH = CARD_W;
export const CARD_EXPORT_HEIGHT = CARD_H;
