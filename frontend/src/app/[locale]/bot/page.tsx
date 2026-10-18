'use client';

import React from 'react';
import { V2Gate } from '@/components/student-v2/Gate';
import { StudentBotV2 } from '@/components/student-v2/Bot';

export default function BotPage() {
  return <V2Gate allow="all" v2={<StudentBotV2 />} />;
}
