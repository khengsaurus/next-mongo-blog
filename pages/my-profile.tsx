import EditIcon from "@mui/icons-material/Edit";
import { Avatar, Fab } from "@mui/material";
import { Centered, CircleLoader, DarkContainer, StyledText } from "components";
import { PageRoute } from "enums";
import { AppContext } from "hooks";
import { markdown } from "lib/client";
import { useContext } from "react";

const MyProfile = () => {
  const { user, routerPush } = useContext(AppContext);
  const { bio, bioMD, avatarKey, username } = user || {};

  return (
    <main className="pad-top">
      {user ? (
        <>
          {avatarKey && (
            <Avatar
              alt={`${username}-avatar`}
              src={`/api/images?key=${avatarKey}`}
              sx={{ width: 200, height: 200 }}
            />
          )}
          <DarkContainer>
            <StyledText text={username} variant="h2" />
          </DarkContainer>
          <DarkContainer>
            {bioMD && bio ? (
              <div
                className="markdown-view card"
                dangerouslySetInnerHTML={{ __html: markdown(bio) }}
              />
            ) : (
              <StyledText text={bio || "(No bio)"} variant="h4" />
            )}
          </DarkContainer>
          <div className="edit-container">
            <Fab
              className="edit-button"
              onClick={() => routerPush(PageRoute.EDIT_PROFILE)}
              disableRipple
            >
              <EditIcon style={{ width: 40, height: 40 }} />
            </Fab>
          </div>
        </>
      ) : (
        <Centered style={{ marginTop: "calc(50vh - 120px)" }}>
          <CircleLoader height={100} width={100} strokeWidth={2} />
        </Centered>
      )}
    </main>
  );
};

export default MyProfile;
