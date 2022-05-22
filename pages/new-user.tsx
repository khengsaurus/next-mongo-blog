import { Alert, Collapse } from "@mui/material";
import { useCallback, useContext, useEffect, useState } from "react";
import { Input, Row, StyledButton } from "../components";
import {
  APIAction,
  DBService,
  HttpRequest,
  PageRoute,
  Status,
  Transition,
} from "../enums";
import { AppContext } from "../hooks/context";
import { HTTPService } from "../lib/client";
import { AlertStatus, IAlert, IUser } from "../types";

const NewUser = () => {
  const { router, user, handleUser, logout } = useContext(AppContext);
  const [username, setUsername] = useState("");
  const [alert, setAlert] = useState<IAlert>(null);
  const [toDeleteIfUnload, setToDeleteIfUnload] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push(PageRoute.LOGIN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, JSON.stringify(user)]);

  const cancelRegister = useCallback(() => {
    setAlert(null);
    HTTPService.makeAuthHttpReq(DBService.USERS, HttpRequest.DELETE, {
      user,
    })
      .then((res) => {
        if (res.status === 200) {
          logout();
          router.push(PageRoute.LOGIN);
        } else {
          console.info(res);
        }
      })
      .catch((err) => console.error(err));
  }, [logout, router, user]);

  // If user ends session before setting username, delete records of email from DB to preserve email availability
  useEffect(() => {
    window.onbeforeunload = () => {
      if (toDeleteIfUnload) {
        cancelRegister();
      }
    };

    return () => {
      window.onbeforeunload = null;
    };
  }, [cancelRegister, toDeleteIfUnload]);

  function registerUsername(
    email: string,
    username: string,
    user: IUser,
    callback?: () => void
  ) {
    HTTPService.makeAuthHttpReq(DBService.USERS, HttpRequest.PUT, {
      email,
      username,
      action: APIAction.USER_SET_USERNAME,
    }).then((res) => {
      if (res.data?.token) {
        handleUser(res.data.token, res.data.user);
        setAlert({
          status: Status.SUCCESS,
          message: "Successfully registered",
        });
        setTimeout(() => router.push(PageRoute.HOME), 2000);
      } else {
        setAlert({ status: Status.ERROR, message: res.data?.message });
      }
      !!callback && callback();
    });
  }

  return (
    <main>
      <Input
        label={"Username"}
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase())}
        style={{ margin: "-5px 0px 5px", width: "150px" }}
        inputProps={{ maxLength: 8 }}
      />
      <Row style={{ width: "170px" }}>
        {alert?.status !== Status.SUCCESS && (
          <>
            <StyledButton label="Cancel" onClick={cancelRegister} />
            <StyledButton
              label={"Submit"}
              autoFocus
              type="submit"
              disabled={username.trim() === ""}
              onClick={() => registerUsername(user?.email, username, user)}
            />
          </>
        )}
      </Row>
      <Collapse in={!!alert} timeout={Transition.FAST} unmountOnExit>
        <Alert severity={alert?.status as AlertStatus}>{alert?.message}</Alert>
      </Collapse>
    </main>
  );
};

export default NewUser;
