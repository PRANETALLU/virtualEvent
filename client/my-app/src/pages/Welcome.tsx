import React from "react";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  text-align: center;
  background-color: black;
  color: white;
  min-height: 100vh; /* Ensures it fills the full viewport height */
  width: 100vw; /* Ensures it fills the full viewport width */
  display: flex;
  flex-direction: column;
`;

// Header Styles
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  width: 100%;
`;

const LogoContainer = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
`;

const LogoImg = styled.img`
  width: 200px;
  height: auto;
`;

const AboutLink = styled.a`
  color: #00cfff;
  text-decoration: none;
  font-size: 28px;
  font-weight: bold;
  margin-right: 30px;
  transition: color 0.3s ease;

  &:hover {
    text-decoration: underline;
    color: #008fbf;
  }
`;

// Main Content
const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  width: 100%; /* Ensure full width */
`;

const Title = styled.h1`
  font-size: 55px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const Highlight = styled.span`
  color: #00cfff;
`;

// Button Styles
const ButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
`;

const Button = styled.button`
  background-color: #00cfff;
  color: white;
  border: none;
  font-family: "Trebuchet MS", sans-serif;
  padding: 12px 25px;
  letter-spacing: 2px;
  width: 160px;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 7px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #008fbf;
    transform: scale(1.05);
  }
`;

const Welcome: React.FC = () => {
  return (
    <Container>
      <Header>
        <LogoContainer>
          <LogoImg src="streamifylogo.png" alt="Streamify Logo" />
        </LogoContainer>
        <nav>
          <AboutLink href="#">ABOUT</AboutLink>
        </nav>
      </Header>

      <Main>
        <Title>
          LIVE. <Highlight>CREATE.</Highlight> CONNECT
        </Title>
        <ButtonsContainer>
          <Button>LOG IN</Button>
          <Button>SIGN UP</Button>
        </ButtonsContainer>
      </Main>
    </Container>
  );
};

export default Welcome;
