'use client';

import React from 'react';
import { Post, PostType } from '@/types';
import { PostStudioV2 } from './PostStudioV2';

interface PostStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
  locale?: string;
  defaultType?: PostType;
}

export const PostStudioModal: React.FC<PostStudioModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  locale = 'ar',
  defaultType = 'STUDY_TIP',
}) => {

  return <PostStudioV2 isOpen={isOpen} onClose={onClose} onPostCreated={onPostCreated} defaultType={defaultType} />;
};

export default PostStudioModal;
