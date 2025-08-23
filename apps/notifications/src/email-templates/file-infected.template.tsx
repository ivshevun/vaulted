import { Container, Heading, Html, Text } from '@react-email/components';
import React from 'react';

interface Props {
  username: string;
  filename: string;
}

export function FileInfectedTemplate({ username, filename }: Props) {
  return (
    <Html>
      <Container
        style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
      >
        <Heading>Vaulted</Heading>
      </Container>
      <Container
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: '10px',
        }}
      >
        <Text>Hi, {username}</Text>
        <Text>
          The file <strong>{filename}</strong> you attempted to upload was
          detected as containing a virus or malicious software during our
          security scan. To protect your account and our systems, the file has
          been <strong>automatically removed</strong> from storage. If you
          believe this is an error, please contact our support team at
          support@vaulted.digital.
        </Text>
        <Text>Thank you for your understanding, The Vaulted Team</Text>
      </Container>
    </Html>
  );
}
