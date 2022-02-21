import { Alert, Collapse, TextField } from "@mui/material";
import { isEmpty } from "lodash";
import { useContext, useEffect, useRef, useState } from "react";
import HomePage from "../components/HomePage";
import { DBService, HttpRequestType, PageRoute, Transition } from "../enum";
import { Status } from "../enums";
import { AppContext } from "../lib/context";
import { StyledButton } from "../styles/StyledMui";
import { AlertStatus, IUser } from "../types";

const NewUser = () => {
  const {
    alert,
    router,
    makeAuthHttpReq,
    setAlert,
    setUser,
    setUserToken,
    user,
  } = useContext(AppContext);
  const [username, setUsername] = useState("");
  // const [toDeleteIfUnload, setToDeleteIfUnload] = useState(true);
  // const checkAuthTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (isEmpty(user)) {
      router.push(PageRoute.LOGIN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, JSON.stringify(user)]);

  // If user ends session before setting username, delete records of email from DB to preserve email availability
  // useEffect(() => {
  //   window.onbeforeunload = () => {
  //     if (toDeleteIfUnload) {
  //       // TODO: clear current user doc
  //     }
  //   };

  //   return () => {
  //     window.onbeforeunload = null;
  //   };
  // }, [toDeleteIfUnload]);

  function cancelRegister() {
    setAlert(null);
    makeAuthHttpReq(DBService.USER, HttpRequestType.DELETE, { user });
    router.push(PageRoute.LOGIN);
  }

  function registerUsername(
    username: string,
    user: IUser,
    callback?: () => void
  ) {
    makeAuthHttpReq(DBService.USER, HttpRequestType.PUT, {
      username,
      email: user.email,
    }).then((res) => {
      if (res.data?.token) {
        setUserToken(res.data.token);
        setUser({ ...user, username }); // not returning user obj...
        setAlert(null);
      } else {
        setAlert({ status: Status.ERROR, message: res.data?.message });
      }
      !!callback && callback();
    });
  }

  const markup = (
    <>
      <TextField
        inputProps={{ maxLength: 8 }}
        label={"Username"}
        onChange={(e) => setUsername(e.target.value.toLowerCase())}
        style={{ margin: "-5px 0px 5px", width: "150px" }}
        type="text"
        value={username}
        variant="standard"
      />
      <div
        className="row"
        style={{ width: "170px", justifyContent: "space-between" }}
      >
        {alert?.status !== Status.SUCCESS && (
          <>
            <StyledButton label="Cancel" onClick={cancelRegister} />
            <StyledButton
              label={"Submit"}
              autoFocus
              type="submit"
              disabled={username.trim() === ""}
              onClick={() => registerUsername(username, user)}
            />
          </>
        )}
      </div>
      <Collapse in={!!alert} timeout={Transition.FAST} unmountOnExit>
        <Alert severity={alert?.status as AlertStatus}>{alert?.message}</Alert>
      </Collapse>
    </>
  );

  return <HomePage title={"New User Page"} markup={markup} />;
};

export default NewUser;
