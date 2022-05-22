import { Alert, Collapse } from "@mui/material";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Input, StyledButton } from "../components";
import {
  APIAction,
  DBService,
  ErrorMessage,
  HttpRequest,
  PageRoute,
  Status,
  Transition,
} from "../enums";
import { AppContext, useFirstEffect } from "../hooks";
import { HTTPService } from "../lib/client";
import { AlertStatus, IAlert, IResponse } from "../types";

const Login = () => {
  const { router, user, handleUser } = useContext(AppContext);
  const [alert, setAlert] = useState<IAlert>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  useFirstEffect(() => {
    if (!!user) {
      router.push(PageRoute.HOME);
    }
  }, [router, user]);

  useEffect(() => {
    setConfirmPassword("");
  }, [showRegister]);

  const loginDisabled = useMemo(
    () => username.trim() === "" || password.trim() === "",
    [username, password]
  );

  const registerDisabled = useMemo(
    () =>
      email.trim() === "" ||
      password.trim() === "" ||
      confirmPassword.trim() === "",
    [email, password, confirmPassword]
  );

  const cleanup = useCallback(
    (res: IResponse, route: PageRoute) => {
      setAlert(null);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      router.push(route);
      handleUser(res.data.token, res.data.user);
    },
    [handleUser, router]
  );

  const handleLogin = useCallback(() => {
    HTTPService.makeAuthHttpReq(DBService.USERS, HttpRequest.POST, {
      username,
      password,
      action: APIAction.LOGIN,
    })
      .then((res) => {
        if (res.status === 200 && res?.data?.token) {
          cleanup(res, PageRoute.HOME);
        } else {
          setAlert({ status: Status.ERROR, message: res?.data?.message });
        }
      })
      .catch((err) => console.error(err));
  }, [cleanup, setAlert, username, password]);

  const handleRegister = useCallback(() => {
    if (password === confirmPassword) {
      HTTPService.makeAuthHttpReq(DBService.USERS, HttpRequest.POST, {
        email,
        password,
        action: APIAction.REGISTER,
      }).then((res) => {
        if (res?.data?.token) {
          cleanup(res, PageRoute.NEWUSER);
        } else {
          setAlert({ status: Status.ERROR, message: res?.data?.message });
        }
      });
    } else {
      setAlert({ status: Status.ERROR, message: ErrorMessage.PW_NOT_MATCHING });
    }
  }, [confirmPassword, email, password, cleanup, setAlert]);

  const renderLoginButton = () => (
    <StyledButton
      label={"Login"}
      type="submit"
      autoFocus
      disabled={loginDisabled}
      onClick={handleLogin}
    />
  );

  const renderRegisterButton = () => (
    <StyledButton
      label={"Register"}
      type="submit"
      autoFocus
      disabled={registerDisabled}
      onClick={handleRegister}
    />
  );

  return (
    <main>
      <Input
        label={showRegister ? "Email" : "Username"}
        value={showRegister ? email : username}
        onChange={(e) =>
          showRegister
            ? setEmail(e.target.value)
            : setUsername(e.target.value?.toLowerCase())
        }
      />
      <Input
        label={"Password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        password
      />
      <Collapse in={showRegister} timeout={300} unmountOnExit>
        <Input
          label={"Confirm Password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          password
        />
      </Collapse>
      <StyledButton
        label={showRegister ? "Back" : "Register"}
        onClick={() => setShowRegister(!showRegister)}
      />
      {showRegister ? renderRegisterButton() : renderLoginButton()}
      <Collapse
        in={!!alert}
        timeout={{ enter: Transition.FAST, exit: Transition.INSTANT }}
        unmountOnExit
      >
        <Alert severity={alert?.status as AlertStatus}>
          {alert?.message || ErrorMessage.TRY_AGAIN}
        </Alert>
      </Collapse>
    </main>
  );
};

export default Login;
