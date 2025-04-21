import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { Link } from "react-router-dom";

const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/") {
            const handleScroll = () => {
                setScrolled(window.scrollY > 10); // 10px 이상 스크롤했을 때
            };

            window.addEventListener("scroll", handleScroll);
            return () => window.removeEventListener("scroll", handleScroll);
        } else {
            setScrolled(true); // 다른 경로에서는 항상 검은 배경
        }
    }, [location.pathname]);

    return (
        <HeaderWrapper scrolled={scrolled}>
            <Logo href="https://ramicstudio.com" >
                RAMIC<br />STUDIO
            </Logo>
            <Nav>
                <Link to={"/news"} style={{ textDecoration: "none" }}>
                    <NavItem>공지사항</NavItem>
                </Link>
                <Link to={"https://store.steampowered.com/search/?developer=RAMIC%20STUDIO"} style={{ textDecoration: "none" }}>
                    <NavItem>게임 플레이</NavItem>
                </Link>
                <Link to={"https://pf.kakao.com/_VecrG/chat"} style={{ textDecoration: "none" }}>
                    <NavItem >고객지원</NavItem>
                </Link>
            </Nav>
        </HeaderWrapper>
    );
};

const expandFromCenter = keyframes`
    0% {
        transform: scaleX(0);
        opacity: 0;
    }
    100% {
        transform: scaleX(1);
        opacity: 1;
    }
`;

const HeaderWrapper = styled.header`
    position: fixed;
    top: 10px;
    left: 20px;
    right: 20px;
    z-index: 1000;

    background-color: ${({ scrolled }) =>
        scrolled ? "rgba(0, 0, 0, 0.85)" : "transparent"};
    color: white;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    border-radius: 45px;

    transform-origin: center;
    transform: scaleX(0);
    opacity: 0;

    animation: ${expandFromCenter} 0.4s ease-out 0.2s forwards;
    backdrop-filter: blur(${({ scrolled }) => (scrolled ? "8px" : "0")});
    transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
`;

const Logo = styled.a`
    font-weight: bold;
    font-size: 14px;
    text-align: center;
    line-height: 1.2;
    text-decoration: none;
    color: white;
`;

const Nav = styled.nav`
    display: flex;
    gap: 24px;
`;

const NavItem = styled.p`
    color: white;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`;

export default Header;