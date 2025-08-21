import PropTypes from "prop-types";
import Select from "./Select";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

const Card = ({
    className = "",
    title,
    arrowTitle,
    option,
    setOption,
    options,
    seeAllUrl,
    tooltip,
    children,
    leftContent,
    rightContent,
}) => {
    return (
        <div className={`card ${className}`}>
            <div className="relative z-2 flex justify-between items-center min-h-[2.5rem]">
                {leftContent}
                {title && (
                    <div className="flex items-center text-lg md:text-[1.125rem]">
                        <div className={`truncate ${options ? "md:max-w-[33vw]" : ""}`}>
                            {title}
                        </div>
                        {arrowTitle && (
                            <Icon
                                className="ml-3 fill-theme-primary md:ml-1.5"
                                name="arrow-next"
                            />
                        )}
                        {tooltip && (
                            <Tooltip
                                className="-mb-0.25 md:mb-0"
                                title={tooltip}
                            />
                        )}
                    </div>
                )}
                {options && (
                    <Select
                        className="shrink-0 min-w-[8.5rem]"
                        value={option}
                        onChange={setOption}
                        items={options}
                    />
                )}
                {seeAllUrl && (
                    <a
                        className="shrink-0 group inline-flex items-center text-base text-primary-1"
                        href={seeAllUrl}
                    >
                        See all
                        <Icon
                            className="!w-4 !h-4 ml-2 fill-primary-1 transition-transform group-hover:translate-x-0.5"
                            name="arrow-next-fat"
                        />
                    </a>
                )}
                {rightContent}
            </div>
            <div>{children}</div>
        </div>
    );
};

Card.propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    arrowTitle: PropTypes.bool,
    option: PropTypes.any,
    setOption: PropTypes.func,
    options: PropTypes.array,
    seeAllUrl: PropTypes.string,
    tooltip: PropTypes.string,
    children: PropTypes.node,
    leftContent: PropTypes.node,
    rightContent: PropTypes.node,
};

export default Card;
