import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInstagram,
  faDiscord,
} from '@fortawesome/free-brands-svg-icons';

const FooterContainer = styled.footer`
  background-color: #111;
  color: #fff;
  padding: 60px 20px;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const Section = styled.div`
  flex: 1 1 300px;
  margin: 20px 0;
`;

const Logo = styled.h2`
  font-size: 24px;
  font-weight: bold;
`;

const Description = styled.p`
  color: #aaa;
  font-size: 14px;
  margin-top: 10px;
`;

const LinkList = styled.ul`
  margin-top: 14px;
  list-style: none;
  padding: 0;
`;

const LinkItem = styled.li`
  margin-bottom: 10px;
`;

const FooterLink = styled.a`
  color: #ccc;
  text-decoration: none;
  &:hover {
    color: #fff;
  }
`;

const SocialIcons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 10px;
`;

const SocialLink = styled.a`
  color: #ccc;
  font-size: 20px;
  &:hover {
    color: #fff;
  }
`;

const Copyright = styled.div`
  text-align: center;
  color: #666;
  font-size: 13px;
  margin-top: 40px;
  border-top: 1px solid #333;
  padding-top: 20px;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        <Section>
          <Logo>Ramic Studio</Logo>
          <Description>
            창의적인 디지털 솔루션을 제공하는 RamicStudio입니다.
          </Description>
        </Section>
        <Section>
          <h3>사이트 링크</h3>
          <LinkList>
            <LinkItem><FooterLink href="/">홈</FooterLink></LinkItem>
            <LinkItem><FooterLink href="/services">공지/소식</FooterLink></LinkItem>
            <LinkItem><FooterLink href="/portfolio">바로가기</FooterLink></LinkItem>
            <LinkItem><FooterLink href="/contact">문의</FooterLink></LinkItem>
          </LinkList>
        </Section>
        <Section>
          <h3>소셜 미디어</h3>
          <SocialIcons>
            <SocialLink href="https://discord.gg/ramicstudio" aria-label="Discord">
              <FontAwesomeIcon icon={faDiscord} />
            </SocialLink>
            <SocialLink href="https://instagram.com/ramicstudio" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </SocialLink>
          </SocialIcons>
        </Section>
      </FooterContent>
      <Copyright>
        &copy; {currentYear} RamicStudio. All rights reserved.
      </Copyright>
    </FooterContainer>
  );
};

export default Footer;